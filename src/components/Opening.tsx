import { productById, productCost } from "../game/products";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Layers,
  Share2,
  BookOpen,
  Coins,
  Sparkles,
  X,
} from "lucide-react";
import type { Game } from "../services/useGame";
import type { Settings } from "../game/types";
import { setById, cardById, imageUrl } from "../game/catalogue";
import {
  advanceOpening,
  startReveal,
  summaryOpening,
  finishOpening,
  purchaseAgain,
  tierNames,
} from "../game/engine";
import { audio, haptic } from "../services/audio";
import { multiplayer } from "../services/multiplayer";
import { CardView } from "./CardView";
import { BoosterPack } from "./BoosterPack";
export function Opening({
  game,
  settings,
  onExit,
  onInspect,
}: {
  game: Game;
  settings: Settings;
  onExit: (destination?: "home" | "cards") => void;
  onInspect: (id: string) => void;
}) {
  const { save, update, busy } = game;
  const opening = save!.pending!;
  const set = setById.get(opening.setId)!;
  const cards = opening.instances.map((id) =>
    save!.owned.find((c) => c.instanceId === id)!,
  );
  const own = cards[opening.cursor];
  const card = own ? cardById.get(own.cardId) : undefined;
  const [flipped, setFlipped] = useState(false);
  const [rip, setRip] = useState(0);
  const [tearing, setTearing] = useState(false);
  const [particles, setParticles] = useState(false);
  const drag = useRef<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const flip = useRef<HTMLDivElement>(null);
  const announced = useRef(new Set<string>());
  const lastCrinkle = useRef(0);
  const repeatId = useRef("");
  const [shareNotice, setShareNotice] = useState("");
  const repeatProduct = productById(
    opening.productId === "daily" ? "standard" : opening.productId,
  )!;
  const best = cards.reduce((a, b) => (b.tier > a.tier ? b : a), cards[0]);
  const uniqueOwned = new Set(save!.owned.map((o) => o.cardId));
  const setProgress = set.cards.filter((c) => uniqueOwned.has(c.id)).length;
  async function repeat() {
    repeatId.current ||= crypto.randomUUID().replaceAll("-", "");
    await update((s) => purchaseAgain(s, set, opening.id, repeatId.current));
    audio.play("coin");
  }
  async function complete(destination: "home" | "cards" = "home") {
    await update((s) => finishOpening(s, opening.id));
    onExit(destination);
  }
  async function shareBest() {
    const def = cardById.get(best.cardId)!;
    const text = `I pulled ${def.name} in PACKVERSE! ${set.name} · ${def.rarity}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "PACKVERSE · " + def.name, text });
        setShareNotice("Shared your discovery.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareNotice("Pull copied to clipboard.");
      } else setShareNotice("Sharing is unavailable in this browser.");
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setShareNotice("Sharing is unavailable right now.");
    }
  }

  useEffect(() => {
    for (const c of cards) {
      const def = cardById.get(c.cardId);
      if (def?.image) {
        const img = new Image();
        img.src = imageUrl(def, true);
      }
    }
  }, [opening.id]);
  useEffect(() => {
    setFlipped(false);
    setParticles(false);
  }, [opening.cursor]);
  useEffect(() => {
    if (!flipped || !flip.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        flip.current,
        { rotateY: 80, scale: 0.92 },
        {
          rotateY: 0,
          scale: 1,
          duration: settings.reducedMotion ? 0 : 0.48,
          ease: "back.out(1.4)",
        },
      );
      if (own?.tier >= 3) {
        gsap.fromTo(
          ".reveal-halo",
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 0.65 },
        );
        setParticles(true);
      }
    }, stage);
    return () => ctx.revert();
  }, [flipped, opening.cursor, settings.reducedMotion]);
  useEffect(() => {
    if (!tearing || !stage.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          void update((s) =>
            s.pending?.id === opening.id ? startReveal(s, opening.id) : s,
          ).catch(() => setTearing(false));
        },
      });
      tl.to(".pack-cap", {
        x: 80,
        y: -80,
        rotation: 25,
        opacity: 0,
        duration: settings.reducedMotion ? 0 : 0.36,
      })
        .to(
          ".booster",
          {
            y: 180,
            scale: 0.84,
            opacity: 0,
            duration: settings.reducedMotion ? 0 : 0.42,
          },
          "<.16",
        )
        .fromTo(
          ".opening-flash",
          { opacity: 0.85 },
          { opacity: 0, duration: 0.5 },
          "<",
        );
    }, stage);
    return () => ctx.revert();
  }, [tearing]);
  function tear() {
    if (tearing || busy) return;
    drag.current = null;
    setRip(1);
    audio.play("rip");
    haptic([15, 20, 35], settings.haptics);
    setTearing(true);
  }
  async function next() {
    if (busy) return;
    if (!flipped) {
      setFlipped(true);
      audio.play(
        own.tier >= 5
          ? "epic"
          : own.tier >= 3
            ? "rare"
            : opening.newIds.includes(own.instanceId)
              ? "new"
              : "duplicate",
      );
      haptic(own.tier >= 3 ? [25, 20, 50] : 12, settings.haptics);
      if (own.tier >= 3 && !announced.current.has(own.instanceId)) {
        announced.current.add(own.instanceId);
        multiplayer.send("pull", { id: own.instanceId, cardId: own.cardId });
      }
    } else {
      audio.play("slide");
      await update((s) =>
        s.pending?.id === opening.id
          ? advanceOpening(s, opening.id, opening.cursor)
          : s,
      );
    }
  }
  return (
    <div
      className={`opening immersive phase-${opening.phase} tier-${own?.tier ?? 2}`}
      ref={stage}
    >
      <div className="opening-top">
        <span>
          <Sparkles size={14} /> {set.name.toUpperCase()}{" "}
          {opening.packCount > 1
            ? ` · ${opening.packOrdinal}/${opening.packCount}`
            : ""}
        </span>
        <button
          className="icon-button"
          aria-label="Save and leave opening"
          onClick={() => onExit()}
        >
          <X size={18} />
        </button>
      </div>
      {opening.phase === "sealed" ? (
        <>
          <div className="opening-heading">
            <span className="eyebrow">YOUR NEXT DISCOVERY</span>
            <h1>Break the seal.</h1>
            <p>A little foil. A whole universe.</p>
          </div>
          <div className="rip-stage">
            <div className="pack-aura" />
            <div
              className="rip-target"
              role="slider"
              aria-label="Rip the booster"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(rip * 100)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  tear();
                }
              }}
              onPointerDown={(e) => {
                if (tearing) return;
                drag.current = e.clientX;
                e.currentTarget.setPointerCapture(e.pointerId);
                audio.play("tap");
              }}
              onPointerMove={(e) => {
                if (drag.current === null || tearing) return;
                const progress = Math.min(
                  1,
                  Math.abs(e.clientX - drag.current) /
                    Math.max(70, e.currentTarget.clientWidth * 0.65),
                );
                setRip(progress);
                if (Date.now() - lastCrinkle.current > 180) {
                  audio.play("rip");
                  lastCrinkle.current = Date.now();
                }
                if (progress > 0.7) tear();
              }}
              onPointerUp={() => {
                if (!tearing) {
                  drag.current = null;
                  setRip(0);
                }
              }}
              onPointerCancel={() => {
                drag.current = null;
                if (!tearing) setRip(0);
              }}
            >
              <BoosterPack set={set} rip={rip} count={cards.length} />
            </div>
          </div>
          <div className="opening-controls">
            <div className="gesture-hint">
              <ArrowRight size={17} />
              <span>DRAG ACROSS THE SEAL</span>
            </div>
            <button
              className="text-button"
              onClick={tear}
              disabled={tearing || busy}
            >
              or tap to rip <ChevronRight size={15} />
            </button>
            <small>Already in your collection. Enjoy the reveal.</small>
          </div>
        </>
      ) : opening.phase === "reveal" ? (
        <>
          <div className="reveal-heading">
            <span className="eyebrow">
              {flipped ? tierNames[own.tier].toUpperCase() : "FEELING LUCKY?"}
            </span>
            <h2>{flipped ? card?.name : "Something extraordinary?"}</h2>
            <div className="reveal-dots">
              {cards.map((c, i) => (
                <i
                  key={c.instanceId}
                  className={i <= opening.cursor ? "active" : ""}
                />
              ))}
            </div>
          </div>
          <div className="reveal-stage">
            <div className="reveal-halo" />
            {[2, 1].map((i) => (
              <div className={`stack-layer layer-${i}`} key={i}>
                <CardView back />
              </div>
            ))}
            <div className="revealed-card" ref={flip} key={own.instanceId}>
              <CardView
                card={card}
                finish={own.finish}
                back={!flipped}
                interactive={flipped && !settings.reducedMotion}
                large
                onClick={() => void next().catch(() => {})}
              />
            </div>
            {particles && (
              <div className="spark-particles" aria-hidden="true">
                {Array.from(
                  { length: settings.graphics === "LOW" ? 8 : 22 },
                  (_, i) => (
                    <i
                      key={i}
                      style={
                        {
                          "--i": i,
                          "--angle": `${(i * 360) / 22}deg`,
                        } as React.CSSProperties
                      }
                    />
                  ),
                )}
              </div>
            )}
            {flipped && opening.newIds.includes(own.instanceId) && (
              <span className="new-card-ribbon">✦ FIRST DISCOVERY</span>
            )}
          </div>
          <div className="opening-controls">
            <span className="card-index">
              {opening.cursor + 1} / {cards.length} ·{" "}
              {flipped
                ? own.finish.toUpperCase() + " FINISH"
                : "TAP THE CARD TO FLIP"}
            </span>
            <button
              className="primary"
              onClick={() => void next().catch(() => {})}
              disabled={busy}
            >
              {flipped ? "NEXT CARD" : "REVEAL CARD"} <ArrowRight size={18} />
            </button>
            <button
              className="text-button"
              onClick={() =>
                void update((s) => summaryOpening(s, opening.id)).catch(
                  () => {},
                )
              }
            >
              Reveal all
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="summary-heading">
            <span className="eyebrow">THE UNIVERSE GROWS</span>
            <h1>
              Good things.
              <br />
              <em>Small packages.</em>
            </h1>
            <div className="summary-chips">
              <span>
                <Layers size={14} /> +{cards.length} CARDS
              </span>
              <span>
                <Sparkles size={14} /> {opening.newIds.length} NEW
              </span>
            </div>
          </div>
          <div className="summary-set-progress">
            <span>BEST PULL · {cardById.get(best.cardId)?.name}</span>
            <small>
              {setProgress}/{set.total} COLLECTED
            </small>
            <div className="progress">
              <i style={{ width: `${(setProgress / set.total) * 100}%` }} />
            </div>
          </div>
          <div className="summary-grid">
            {cards.map((c) => (
              <button
                className="summary-card"
                key={c.instanceId}
                onClick={() => onInspect(c.instanceId)}
              >
                <CardView card={cardById.get(c.cardId)} finish={c.finish} />
                <span>{cardById.get(c.cardId)?.name}</span>
                <small className={`rarity tier-${c.tier}`}>
                  {tierNames[c.tier]}
                </small>
                {opening.newIds.includes(c.instanceId) ? (
                  <b>NEW</b>
                ) : (
                  <b className="duplicate-marker">DUPLICATE</b>
                )}
              </button>
            ))}
          </div>
          <div className="opening-controls summary-controls">
            <p className="save-notice">
              <Check size={14} /> Every card is saved to your binder.
            </p>
            {save!.queued.length ? (
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  void update((s) => finishOpening(s, opening.id)).catch(
                    () => {},
                  )
                }
              >
                NEXT BUNDLE PACK <ArrowRight size={17} />
              </button>
            ) : (
              <button
                className="primary"
                disabled={busy || save!.coins < productCost(repeatProduct, set)}
                onClick={() => void repeat().catch(() => {})}
              >
                {opening.productId === "daily"
                  ? "OPEN STANDARD"
                  : "OPEN ANOTHER"}
                <span>
                  <Coins size={14} />
                  {productCost(repeatProduct, set)}
                </span>
              </button>
            )}
            <div className="summary-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void complete("cards").catch(() => {})}
              >
                <BookOpen size={14} /> VIEW CARDS
              </button>
              <button className="secondary" onClick={() => void shareBest()}>
                <Share2 size={14} /> SHARE PULL
              </button>
            </div>
            {shareNotice && <small role="status">{shareNotice}</small>}
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void complete().catch(() => {})}
            >
              BACK TO THE UNIVERSE <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
      <div className="opening-flash" />
    </div>
  );
}
