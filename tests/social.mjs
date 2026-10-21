import { createServer } from "vite";
import http from "node:http";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, launchOptions, dependency } from "./browser-support.mjs";
const { WebSocketServer } = dependency("ws");
const messages = [],
  records = new Map(),
  scores = new Map(),
  clients = new Map(),
  requests = [];
let nextId = 1;
const api = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,X-Player-Profile",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.end("{}");
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  const json = body ? JSON.parse(body) : {};
  const path = req.url;
  const header = req.headers["x-player-profile"];
  const profile = header
    ? JSON.parse(Buffer.from(header, "base64url").toString())
    : null;
  requests.push({ method: req.method, path, profile });
  const send = (data, status = 200) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };
  if (path === "/api/v1/schema") {
    send({
      version: 3,
      store: [
        {
          name: "social",
          maxBytes: 5120,
          maxRecords: 600,
          ttlHours: 168,
          clientAsserted: true,
        },
      ],
    });
    return;
  }
  if (path === "/api/v1/games/game2/config") {
    send({ game: "game2", maxTotalPlayers: 12, maxMessageBytes: 20480 });
    return;
  }
  if (path === "/api/v1/games/game2/chat/lobby") {
    if (req.method === "GET") send({ ok: true, messages });
    else {
      assert(profile);
      const message = {
        id: "m" + messages.length,
        playerId: profile.playerId,
        name: profile.nickName,
        text: json.text,
        at: Date.now(),
        avatar: profile.avatar,
      };
      messages.push(message);
      send({ ok: true, message });
      for (const ws of clients.keys())
        ws.send(JSON.stringify({ type: "chat", message }));
    }
    return;
  }
  if (path === "/api/v1/games/game2/data/social") {
    send({
      ok: true,
      records: [...records.entries()]
        .filter(([id]) => id.startsWith("pull"))
        .map(([id, r]) => ({ id, ...r })),
    });
    return;
  }
  if (
    path.startsWith("/api/v1/games/game2/data/social/") ||
    path.startsWith("/api/v1/games/game2/data/trading/")
  ) {
    const id = path.split("/").at(-1);
    if (req.method === "PUT") {
      assert(profile);
      const prior = records.get(id);
      if ((prior?.revision ?? 0) !== json.expectedRevision) {
        send({ ok: false }, 409);
        return;
      }
      records.set(id, {
        data: json.data,
        owner: profile.playerId,
        revision: json.expectedRevision + 1,
      });
      send({ ok: true, revision: json.expectedRevision + 1 });
    } else {
      send(
        { ok: records.has(id), record: records.get(id) },
        records.has(id) ? 200 : 404,
      );
    }
    return;
  }
  if (path.startsWith("/api/v1/games/game2/scores")) {
    assert(profile);
    scores.set(profile.playerId, {
      playerId: profile.playerId,
      name: profile.nickName,
      score: json.score,
    });
    send({ ok: true });
    return;
  }
  if (path.startsWith("/api/v1/games/game2/leaderboards")) {
    send({
      ok: true,
      players: [...scores.values()]
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    });
    return;
  }
  send({ error: "Not found" }, 404);
});
const wss = new WebSocketServer({ server: api });
wss.on("connection", (ws, req) => {
  assert.equal(req.url, "/ws/game2/lobby");
  const id = "c" + nextId++;
  for (const peer of clients.keys())
    peer.send(JSON.stringify({ type: "joined", id }));
  clients.set(ws, id);
  ws.send(
    JSON.stringify({
      type: "welcome",
      id,
      game: "game2",
      room: "lobby",
      playersInRoom: clients.size,
      maxTotalPlayers: 12,
    }),
  );
  ws.on("message", (raw) => {
    const m = JSON.parse(raw.toString());
    assert(raw.length <= 20480);
    for (const [peer] of clients)
      if (peer !== ws) peer.send(JSON.stringify({ ...m, from: id }));
  });
  ws.on("close", () => {
    clients.delete(ws);
    for (const peer of clients.keys())
      peer.send(JSON.stringify({ type: "left", id }));
  });
});
await new Promise((r) => api.listen(8789, "127.0.0.1", r));
const app = await createServer({ server: { host: "127.0.0.1", port: 8080 } });
await app.listen();
const browser = await chromium.launch(launchOptions);
const errors = [];
async function player() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 700 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("https://**/*", (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem("packverse-host", "http://127.0.0.1:8789");
    localStorage.setItem("packverse-intro-seen", "1");
  });
  await page.goto("http://127.0.0.1:8080");
  await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
  return { context, page };
}
async function join(p) {
  await p
    .getByRole("navigation")
    .getByRole("button", { name: "SOCIAL", exact: true })
    .click();
  await p.getByText("LIVE · LOBBY").waitFor();
}
try {
  const a = await player(),
    b = await player();
  await join(a.page);
  await a.page.waitForTimeout(250);
  await join(b.page);
  await a.page
    .getByText("2 collectors here · Game 2")
    .waitFor({ timeout: 18000 });
  await b.page
    .getByText("2 collectors here · Game 2")
    .waitFor({ timeout: 18000 });
  const idA = await a.page.evaluate(() =>
      localStorage.getItem("packverse-browser-id"),
    ),
    idB = await b.page.evaluate(() =>
      localStorage.getItem("packverse-browser-id"),
    );
  assert.notEqual(idA, idB);
  await a.page
    .getByRole("textbox", { name: "Chat message" })
    .fill("A real synchronized hello 🎴");
  await a.page.getByRole("button", { name: "Send message" }).click();
  await b.page
    .getByText("A real synchronized hello 🎴", { exact: true })
    .waitFor();
  assert.equal(
    await a.page
      .getByText("A real synchronized hello 🎴", { exact: true })
      .count(),
    1,
  );
  await a.page.getByRole("button", { name: "Collectors", exact: true }).click();
  await a.page
    .getByRole("button", { name: "PUBLISH SHOWCASE & SCORE" })
    .click();
  await a.page.getByText("Showcase and collection score published.").waitFor();
  assert(records.has("p_" + idA));
  assert.equal(scores.get(idA).score, 0);
  await b.page.getByRole("button", { name: "Collectors", exact: true }).click();
  await b.page.getByRole("textbox", { name: "Collector ID" }).fill(idA);
  await b.page
    .getByRole("button", { name: "Find collector", exact: true })
    .click();
  await b.page.getByRole("button", { name: "SAVE COLLECTOR" }).click();
  await b.page
    .getByRole("button", { name: "REMOVE SAVED COLLECTOR" })
    .waitFor();
  // Seed two independently persisted collections, then exchange through actual HTTP and WS.
  async function seed(page, cardId, instanceId) {
    await page.evaluate(
      async ({ cardId, instanceId }) => {
        const { transact } = await import("/src/services/persistence.ts");
        const { cardById } = await import("/src/game/catalogue.ts");
        const d = cardById.get(cardId);
        await transact(localStorage.getItem("packverse-browser-id"), (s) => ({
          ...s,
          owned: [
            {
              instanceId,
              cardId,
              setId: d.setId,
              finish: "holo",
              tier: d.tier,
              openingId: "fixture",
              obtainedAt: 1,
            },
          ],
        }));
      },
      { cardId, instanceId },
    );
    await page.reload();
    await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
    await join(page);
  }
  await seed(a.page, "base1-4", "tradeA");
  await seed(b.page, "neo1-9", "tradeB");
  await a.page.getByRole("button", { name: "Trades", exact: true }).click();
  await a.page.getByRole("button", { name: /OFFER TRADE/ }).click();
  await a.page
    .getByRole("button", { name: "Offer Charizard tradeA", exact: true })
    .click();
  await b.page.getByRole("button", { name: "Trades", exact: true }).click();
  await b.page
    .getByRole("button", { name: "Offer Lugia tradeB", exact: true })
    .click();
  await a.page.getByText("Lugia", { exact: true }).first().waitFor();
  await a.page.getByRole("button", { name: "CONFIRM THESE CARDS" }).click();
  await a.page.getByText(/Your confirmation is saved/).waitFor();
  // Reload unconfirmed partner: prepared terms are recovered from the live peer.
  await b.page.reload();
  await join(b.page);
  await b.page.getByRole("button", { name: "Trades", exact: true }).click();
  await b.page
    .getByRole("button", { name: "CONFIRM THESE CARDS" })
    .waitFor({ timeout: 20000 });
  await b.page.getByRole("button", { name: "CONFIRM THESE CARDS" }).click();
  await a.page.getByText(/Trade complete/).waitFor({ timeout: 20000 });
  await b.page.getByText(/Trade complete/).waitFor({ timeout: 20000 });
  async function inventory(page) {
    return page.evaluate(async () => {
      const { loadSave } = await import("/src/services/persistence.ts");
      return (await loadSave(localStorage.getItem("packverse-browser-id")))
        .owned;
    });
  }
  assert.equal((await inventory(a.page))[0].cardId, "neo1-9");
  assert.equal((await inventory(b.page))[0].cardId, "base1-4");
  await a.page.reload();
  await join(a.page);
  assert.equal((await inventory(a.page)).length, 1);
  await a.page.evaluate(async () => {
    const { multiplayer } = await import("/src/services/multiplayer.ts");
    multiplayer.send("pull", { id: "integration-pull", cardId: "base1-4" });
  });
  await b.page.getByRole("button", { name: "Lounge", exact: true }).click();
  await b.page
    .locator(".activity-item strong")
    .filter({ hasText: "Charizard" })
    .waitFor();
  await b.page.screenshot({ path: "test-results/social-two-players.png" });
  assert.deepEqual(errors, []);
  assert(
    requests.every(
      (r) =>
        !r.path.includes("game1") &&
        !r.path.includes("game3") &&
        !r.path.includes("/guest"),
    ),
  );
  fs.writeFileSync(
    "test-results/social-report.json",
    JSON.stringify(
      {
        ok: true,
        players: [idA, idB],
        checks: [
          "presence",
          "UTF8 chat and echo dedupe",
          "profile persistence",
          "leaderboard submission",
          "friend save",
          "automatic connection and reload recovery",
          "mutually confirmed live card exchange and reload idempotency",
          "independent local inventories",
          "live remote rare pull",
        ],
        requests: requests.map((r) => ({ method: r.method, path: r.path })),
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: two independent collectors, chat, presence/recovery, profile, rankings, friends, separate inventories and synchronized rare-pull feed",
  );
  await a.context.close();
  await b.context.close();
} finally {
  await browser.close();
  for (const ws of clients.keys()) ws.terminate();
  await new Promise((r) => wss.close(r));
  await new Promise((r) => api.close(r));
  await app.close();
}
