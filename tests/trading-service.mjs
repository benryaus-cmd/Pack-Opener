import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium, launchOptions } from "./browser-support.mjs";

const app = await createServer({ server: { host: "127.0.0.1", port: 0 } });
await app.listen();
const address = app.httpServer.address();
const browser = await chromium.launch(launchOptions);
try {
  const page = await browser.newPage();
  await page.route("**/trade-service-fixture.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Trade service regression</title>",
    }),
  );
  await page.goto(
    `http://127.0.0.1:${address.port}/trade-service-fixture.html`,
  );
  const results = await page.evaluate(async () => {
    const { trading } = await import("/src/services/trading.ts");
    const { multiplayer } = await import("/src/services/multiplayer.ts");
    const { initialSave } = await import("/src/game/engine.ts");
    const {
      prepareTrade,
      completeTrade,
      tradeDigest,
      tradeRecordId,
      lockedTradeIds,
    } = await import("/src/game/trading.ts");
    const { cardById } = await import("/src/game/catalogue.ts");
    const Trading = trading.constructor;
    const passed = [];
    const check = (condition, message) => {
      if (!condition) throw Error(message);
    };
    const me = "a_" + "1".repeat(32),
      other = "a_" + "2".repeat(32),
      next = "a_" + "3".repeat(32);
    const definition = [...cardById.values()][0];
    const card = (instanceId) => ({
      instanceId,
      cardId: definition.id,
      setId: definition.setId,
      finish: "matte",
      tier: 0,
      obtainedAt: 1,
      openingId: "pack",
    });
    const a = card("a1"),
      b = card("b1");
    const terms = {
      id: "a".repeat(20),
      parties: [me, other],
      offers: { [me]: [a], [other]: [b] },
    };
    const live = {
      ...terms,
      versions: { [me]: 1, [other]: 1 },
      ready: [],
      status: "draft",
    };
    const packet = {
      action: "ready",
      id: terms.id,
      parties: terms.parties,
      target: me,
      digest: tradeDigest(terms),
    };
    const deferred = () => {
      let resolve;
      const promise = new Promise((r) => {
        resolve = r;
      });
      return { promise, resolve };
    };
    const game = (id = me, save = { ...initialSave(), owned: [a] }) => {
      const g = {
        profile: { playerId: id, nickName: id, username: id, avatar: "" },
        save,
      };
      g.update = async (fn) => {
        g.save = fn(g.save);
        return g.save;
      };
      return g;
    };
    const sent = [];
    const records = new Map();
    multiplayer.snapshot = () => ({
      status: "online",
      peers: { peer: { profile: { playerId: other } } },
    });
    multiplayer.send = (event, data) => {
      sent.push({ event, data });
      return true;
    };
    const normalRequest = async (path, options) => {
      if (options?.method === "PUT") {
        const { data } = JSON.parse(options.body);
        records.set(path, data);
        return { record: { data, revision: 1 } };
      }
      return { record: { data: records.get(path), revision: 0 } };
    };
    multiplayer.request = normalRequest;

    // Different durable confirmations must release the reservation instead of waiting forever.
    {
      const service = new Trading(),
        g = game(me, prepareTrade({ ...initialSave(), owned: [a] }, terms, me));
      service.bind(g);
      const crossed = {
        ...terms,
        offers: { ...terms.offers, [other]: [card("b2")] },
      };
      records.set("/data/trading/" + tradeRecordId(terms.id, other), {
        ...crossed,
        digest: tradeDigest(crossed),
        status: "ready",
      });
      await service.recover();
      check(
        g.save.trades[0].status === "cancelled",
        "crossed confirmations did not cancel",
      );
      check(
        lockedTradeIds(g.save).size === 0,
        "crossed confirmation left a reserved card",
      );
      check(g.save.owned[0].instanceId === "a1", "cancel changed collection");
      check(
        records.get("/data/trading/" + tradeRecordId(terms.id, me)).status ===
          "cancelled",
        "cancellation not durable",
      );
      passed.push("durable mismatched confirmations release reservations");
    }
    // Cancelling crossed terms before local confirmation still needs a terminal local journal.
    {
      const service = new Trading(),
        g = game();
      service.bind(g);
      service.state = { session: live, error: "", busy: false };
      multiplayer.request = normalRequest;
      const crossed = {
        ...terms,
        offers: { ...terms.offers, [other]: [card("b2")] },
      };
      const crossedPacket = { ...packet, digest: tradeDigest(crossed) };
      records.set("/data/trading/" + tradeRecordId(terms.id, other), {
        ...crossed,
        digest: tradeDigest(crossed),
        status: "ready",
      });
      await service.accept("trade", crossedPacket, "peer");
      check(
        g.save.trades?.some(
          (j) => j.id === terms.id && j.status === "cancelled",
        ),
        "unconfirmed crossed cancellation was not journaled",
      );
      await service.accept("trade", crossedPacket, "peer");
      check(
        service.snapshot().session?.status === "cancelled",
        "delayed ready revived crossed cancellation",
      );
      passed.push("unconfirmed mismatch cancellation survives delayed ready");
    }
    // Terminal journals are authoritative locally even if a delayed ready arrives.
    for (const status of ["cancelled", "completed"]) {
      const prepared = prepareTrade(
        { ...initialSave(), owned: [a] },
        terms,
        me,
      );
      const save =
        status === "completed"
          ? completeTrade(prepared, terms, me)
          : {
              ...prepared,
              trades: prepared.trades.map((j) => ({ ...j, status })),
            };
      const service = new Trading(),
        g = game(me, save);
      service.bind(g);
      await service.accept("trade", packet, "peer");
      check(
        service.snapshot().session === null,
        "late ready reopened " + status + " trade",
      );
      check(g.save === save, "late ready changed terminal save");
      passed.push(status + " journal ignores delayed ready");
    }
    // Switching collectors while the durable decline PUT is pending must never update the new save.
    {
      const service = new Trading(),
        old = game(),
        replacement = game(next),
        gate = deferred(),
        started = deferred();
      service.bind(old);
      service.state = { session: live, error: "", busy: false };
      multiplayer.request = async (path, options) => {
        if (options?.method === "PUT") {
          started.resolve();
          await gate.promise;
        }
        return normalRequest(path, options);
      };
      const action = service.decline();
      await started.promise;
      service.reset();
      service.bind(replacement);
      const original = replacement.save;
      gate.resolve();
      await action;
      check(
        replacement.save === original,
        "old decline modified replacement save",
      );
      check(
        service.snapshot().session === null &&
          !service.snapshot().error &&
          !service.snapshot().busy,
        "old decline patched replacement UI",
      );
      passed.push("profile switch during decline PUT is isolated");
    }
    // A ready-record read completing for a previous collector must not install its session.
    {
      const service = new Trading(),
        gate = deferred(),
        started = deferred();
      service.bind(game());
      multiplayer.request = async () => {
        started.resolve();
        await gate.promise;
        return {
          record: {
            data: { ...terms, digest: tradeDigest(terms), status: "ready" },
          },
        };
      };
      const action = service.accept("trade", packet, "peer").catch(() => {});
      await started.promise;
      service.reset();
      service.bind(game(next));
      gate.resolve();
      await action;
      check(
        service.snapshot().session === null,
        "old ready fetch installed session after profile switch",
      );
      passed.push("profile switch during incoming ready fetch is isolated");
    }
    // Both confirmation and recovery can await an IndexedDB write across a collector switch.
    for (const operation of ["confirm", "recover"]) {
      const service = new Trading(),
        gate = deferred(),
        started = deferred();
      const save =
        operation === "recover"
          ? prepareTrade({ ...initialSave(), owned: [a] }, terms, me)
          : { ...initialSave(), owned: [a] };
      const old = game(me, save),
        replacement = game(next);
      old.update = async (fn) => {
        const result = fn(old.save);
        started.resolve();
        await gate.promise;
        old.save = result;
        return result;
      };
      service.bind(old);
      service.state = { session: live, error: "", busy: false };
      multiplayer.request = normalRequest;
      records.set("/data/trading/" + tradeRecordId(terms.id, other), {
        ...terms,
        digest: tradeDigest(terms),
        status: "ready",
      });
      const action = service[operation]();
      await started.promise;
      service.reset();
      service.bind(replacement);
      const original = replacement.save;
      gate.resolve();
      await action;
      check(
        replacement.save === original,
        "old " + operation + " replaced new save",
      );
      check(
        service.game.save === original,
        "old " + operation + " replaced bound save",
      );
      check(
        service.snapshot().session === null &&
          !service.snapshot().error &&
          !service.snapshot().busy,
        "old " + operation + " patched new UI",
      );
      passed.push(
        "profile switch during " + operation + " local write is isolated",
      );
    }
    check(
      sent
        .filter((p) => p.data.action === "ready")
        .every(
          (p) => new TextEncoder().encode(JSON.stringify(p)).length < 1800,
        ),
      "ready packet exceeds relay cap",
    );
    return passed;
  });
  assert.equal(results.length, 8);
  console.log(results.map((name) => "PASS " + name).join("\n"));
} finally {
  await browser.close();
  await app.close();
}
