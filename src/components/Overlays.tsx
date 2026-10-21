import {
  productById,
  productCost,
  slotPool,
  guaranteeLabel,
} from "../game/products";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  Check,
  Eye,
  Gift,
  Heart,
  Layers,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";
import type { Game } from "../services/useGame";
import type { Settings, SetDefinition, Save } from "../game/types";
import { cardById, setById, allCards, imageUrl } from "../game/catalogue";
import {
  missions,
  claimMission,
  claimStudy,
  cardKey,
  favourite,
  showcase,
  recycle,
  tierNames,
  prototypeWeights,
} from "../game/engine";
import { audio, haptic } from "../services/audio";
import { CardView } from "./CardView";
export function Inspector({
  id,
  game,
  onRecycle,
}: {
  id: string;
  game: Game;
  onRecycle: (id: string) => void;
}) {
  const save = game.save!;
  const own = save.owned.find((c) => c.instanceId === id);
  const card = cardById.get(own?.cardId ?? id);
  const [zoom, setZoom] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const tilt = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!motionEnabled) return;
    function sensor(e: DeviceOrientationEvent) {
      const el = tilt.current?.querySelector<HTMLElement>(".card-view");
      if (!el) return;
      el.style.setProperty(
        "--ry",
        `${Math.max(-12, Math.min(12, (e.gamma ?? 0) / 2))}deg`,
      );
      el.style.setProperty(
        "--rx",
        `${Math.max(-12, Math.min(12, ((e.beta ?? 45) - 45) / 2))}deg`,
      );
    }
    window.addEventListener("deviceorientation", sensor);
    return () => window.removeEventListener("deviceorientation", sensor);
  }, [motionEnabled]);
  if (!card) return <p>This card is unavailable.</p>;
  const set = setById.get(card.setId)!;
  const copies = save.owned.filter((c) => c.cardId === card.id);
  const canRecycle =
    own &&
    save.owned.filter((c) => cardKey(c) === cardKey(own)).length > 1 &&
    !save.favourites.includes(own.instanceId) &&
    !save.pending?.instances.includes(own.instanceId);
  async function share() {
    const text = `I discovered ${card!.name} in PACKVERSE! ${set.name} · ${card!.rarity}`;
    try {
      if (navigator.share)
        await navigator.share({ title: "PACKVERSE discovery", text });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
    } catch {
      /* Share cancellation leaves the collection unchanged. */
    }
  }
  return (
    <div className="inspector">
      <div
        ref={tilt}
        className={`inspect-art ${zoom ? "zoomed" : ""}`}
        onDoubleClick={() => setZoom((v) => !v)}
      >
        <CardView
          card={card}
          finish={own?.finish ?? (card.holo ? "holo" : "matte")}
          interactive
          large
          key={card.id}
        />
      </div>
      <span className={`rarity-badge tier-${card.tier}`}>
        ✦ {tierNames[card.tier].toUpperCase()}
      </span>
      <h2>{card.name}</h2>
      <p>
        {set.name} · #{card.localId}/{set.total}
      </p>
      <div className="inspect-details">
        <span>
          PRINTED RARITY<b>{card.rarity}</b>
        </span>
        <span>
          FINISH
          <b>
            {own
              ? own.finish + " · prototype"
              : card.holo
                ? "Holo"
                : "Catalogue preview"}
          </b>
        </span>
        <span>
          OWNED
          <b>
            {copies.length} {copies.length === 1 ? "copy" : "copies"}
          </b>
        </span>
        <span>
          DISCOVERED
          <b>
            {own
              ? new Date(own.obtainedAt).toLocaleDateString()
              : "Waiting for you"}
          </b>
        </span>
      </div>
      {own && (
        <div className="inspector-actions">
          <button
            className={save.favourites.includes(id) ? "selected" : ""}
            onClick={() =>
              void game.update((s) => favourite(s, id)).catch(() => {})
            }
          >
            <Heart
              size={18}
              fill={save.favourites.includes(id) ? "currentColor" : "none"}
            />{" "}
            FAVOURITE
          </button>
          <button
            className={save.showcase.includes(id) ? "selected" : ""}
            onClick={() =>
              void game.update((s) => showcase(s, id)).catch(() => {})
            }
          >
            <Eye size={18} /> SHOWCASE
          </button>
          <button onClick={() => void share()}>
            <Share2 size={18} /> SHARE
          </button>
        </div>
      )}
      <p className="fine-print">
        Drag to catch the light. Double-tap to zoom.
        <br />
        Finishes are prototype display treatments.
      </p>
      {"DeviceOrientationEvent" in window && (
        <button
          className="text-button"
          onClick={() => {
            const sensor = DeviceOrientationEvent as unknown as {
              requestPermission?: () => Promise<string>;
            };
            void (
              sensor.requestPermission?.() ?? Promise.resolve("granted")
            ).then((result) => {
              if (result === "granted") setMotionEnabled((v) => !v);
            });
          }}
        >
          {motionEnabled ? "DISABLE" : "ENABLE"} MOTION TILT
        </button>
      )}
      {canRecycle && (
        <button className="secondary full" onClick={() => onRecycle(id)}>
          RECYCLE EXTRA COPY <Coins size={15} /> +
          {[2, 4, 8, 12, 20, 30, 40][own.tier]}
        </button>
      )}
    </div>
  );
}
export function MissionPanel({
  game,
  onStudy,
}: {
  game: Game;
  onStudy: () => void;
}) {
  const s = game.save!;
  return (
    <>
      <div className="mission-intro">
        <Target size={30} />
        <h2>A reason to rip.</h2>
        <p>Small discoveries. Meaningful rewards.</p>
      </div>
      <div className="mission-list">
        {missions(s).map((m) => (
          <article
            className={`mission-row ${m.claimed ? "claimed" : ""}`}
            key={m.id}
          >
            <div className="mission-icon">
              {m.period === "weekly" ? (
                <Trophy size={20} />
              ) : m.id === "inspect" ? (
                <Eye size={20} />
              ) : (
                <Sparkles size={20} />
              )}
            </div>
            <div>
              <span className="eyebrow">{m.period.toUpperCase()}</span>
              <b>{m.label}</b>
              <small>
                {Math.min(m.target, m.value)} / {m.target}
              </small>
              <div className="progress">
                <i
                  style={{
                    width: `${Math.min(100, (m.value / m.target) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <button
              disabled={m.claimed || m.value < m.target || game.busy}
              onClick={() =>
                void game
                  .update((x) => claimMission(x, m.id))
                  .then(() => audio.play("mission"))
                  .catch(() => {})
              }
            >
              {m.claimed ? (
                <Check size={17} />
              ) : (
                <>
                  <Coins size={13} />
                  {m.reward}
                </>
              )}
            </button>
          </article>
        ))}
      </div>
      <div className="study-promo">
        <div>
          <span className="eyebrow">COLLECTOR’S EYE</span>
          <h3>A sharp eye pays off.</h3>
          <p>
            Match three pairs to earn 25 coins.
            <br />
            Up to 20 rewards a day · 30s rest between wins.
          </p>
        </div>
        <button className="primary" onClick={onStudy}>
          PLAY & EARN <ArrowIcon />
        </button>
      </div>
      <p className="fine-print">
        Daily missions reset at 00:00 UTC. Weekly missions reset on Monday at
        00:00 UTC.
      </p>
    </>
  );
}
function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}
export function Study({ game, onDone }: { game: Game; onDone: () => void }) {
  const deck = useMemo(() => {
    const pool = game.save!.owned.length
      ? game.save!.owned.map((o) => cardById.get(o.cardId)!).filter(Boolean)
      : allCards.slice(0, 16);
    const unique = [...new Map(pool.map((c) => [c.id, c])).values()];
    while (unique.length < 3) unique.push(allCards[unique.length]);
    const picked = unique.slice(-3);
    return [...picked, ...picked]
      .map((card, i) => ({ card, key: i }))
      .sort(() => Math.random() - 0.5);
  }, []);
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    if (deck[a].card.id === deck[b].card.id) {
      setMatched((m) => [...m, a, b]);
      setSelected([]);
      audio.play("new");
    } else {
      const t = setTimeout(() => setSelected([]), 650);
      return () => clearTimeout(t);
    }
  }, [selected, deck]);
  const complete = matched.length === 6;
  return (
    <div className="study-game">
      <span className="eyebrow">COLLECTOR’S EYE</span>
      <h2>
        {won
          ? "Sharp eyes. Nice coins."
          : complete
            ? "Beautifully spotted."
            : "Find the three pairs."}
      </h2>
      <p>Turn two cards. Remember what you see.</p>
      <div className="study-grid">
        {deck.map(({ card }, i) => (
          <button
            key={i}
            disabled={selected.length === 2 || matched.includes(i) || won}
            aria-label={`Memory card ${i + 1}`}
            onClick={() => {
              if (!selected.includes(i)) {
                setSelected((x) => [...x, i]);
                audio.play("flip");
              }
            }}
            className={matched.includes(i) ? "matched" : ""}
          >
            <CardView
              card={card}
              back={!selected.includes(i) && !matched.includes(i)}
            />
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {complete && (
        <button
          className="primary"
          disabled={won || game.busy}
          onClick={() =>
            void game
              .update((s) => claimStudy(s))
              .then(() => {
                setWon(true);
                audio.play("coin");
              })
              .catch((e) => setError(e.message))
          }
        >
          {won ? (
            <>
              <Check size={16} /> 25 COINS ADDED
            </>
          ) : (
            <>
              CLAIM 25 <Coins size={16} />
            </>
          )}
        </button>
      )}
      <button className="text-button" onClick={onDone}>
        BACK TO MISSIONS
      </button>
    </div>
  );
}
export function Odds({
  set,
  productId = "standard",
}: {
  set: SetDefinition;
  productId?: string;
}) {
  const product = productById(productId)!;
  return (
    <div className="odds">
      <span className="eyebrow">{set.era.toUpperCase()} COLLECTION</span>
      <h2>{product.name}</h2>
      <p>
        {set.name} · {product.packs} pack{product.packs > 1 ? "s" : ""} ×{" "}
        {product.count} cards from {set.total} real definitions.{" "}
        {guaranteeLabel(product, set)}.
      </p>
      <h3>Every slot · prototype rates</h3>
      {product.slots.map((slot, i) => {
        const pool = slotPool(slot, set),
          tiers = [...new Set(pool.map((c) => c.tier))].sort(),
          total = tiers.reduce(
            (n, t) => n + (slot.weighted ? (prototypeWeights[t] ?? 1) : 1),
            0,
          );
        return (
          <div className="slot-odds" key={i}>
            <h3>
              SLOT {i + 1} · {slot.name.toUpperCase()}
            </h3>
            {tiers.map((t) => (
              <div className="odds-row" key={t}>
                <span className={`rarity tier-${t}`}>{tierNames[t]}</span>
                <strong>
                  {(
                    ((slot.weighted ? (prototypeWeights[t] ?? 1) : 1) / total) *
                    100
                  ).toFixed(2)}
                  %
                </strong>
              </div>
            ))}
          </div>
        );
      })}
      <p>
        Within each selected tier, eligible cards have equal probability. Ultra
        guarantees fall back to rare-or-better in legacy sets without ultra-tier
        definitions. Bundle rates repeat per pack. The reverse slot adds a
        prototype finish.
      </p>
      <div className="notice">
        <ShieldCheck size={22} />
        <p>
          These are game prototype rates, not authentic sealed-product odds.
          Original printed rarity is shown in the inspector. Finishes are
          prototype display treatments.
        </p>
      </div>
      <small>
        Price: {productCost(product, set) || "FREE"} coins · All copies are
        saved before the first reveal. Daily Free Pack: once per UTC day.
      </small>
    </div>
  );
}
export function SettingsPanel({
  settings,
  onChange,
  save,
  networkStatus,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  save: Save;
  networkStatus: string;
}) {
  const update = (patch: Partial<Settings>) =>
    onChange({ ...settings, ...patch });
  return (
    <div className="settings-panel">
      <span className="eyebrow">MAKE IT YOURS</span>
      <h3>Sound & feel</h3>
      {(["master", "music", "sfx"] as const).map((key) => (
        <label className="slider-setting" key={key}>
          <span>
            {key === "sfx"
              ? "Sound effects"
              : key[0].toUpperCase() + key.slice(1)}
            <b>{Math.round(settings[key] * 100)}%</b>
          </span>
          <input
            aria-label={`${key} volume`}
            type="range"
            min="0"
            max="1"
            step=".01"
            value={settings[key]}
            onChange={(e) => update({ [key]: Number(e.target.value) })}
          />
        </label>
      ))}
      <label className="toggle">
        <span>Mute audio</span>
        <input
          type="checkbox"
          checked={settings.muted}
          onChange={(e) => update({ muted: e.target.checked })}
        />
      </label>
      <label className="toggle">
        <span>Haptic feedback</span>
        <input
          type="checkbox"
          checked={settings.haptics}
          onChange={(e) => {
            update({ haptics: e.target.checked });
            haptic(15, e.target.checked);
          }}
        />
      </label>
      <h3>Performance</h3>
      <label className="toggle">
        <span>Graphics quality</span>
        <select
          aria-label="Graphics quality"
          value={settings.graphics}
          onChange={(e) =>
            update({ graphics: e.target.value as Settings["graphics"] })
          }
        >
          <option>AUTO</option>
          <option>HIGH</option>
          <option>LOW</option>
        </select>
      </label>
      <label className="toggle">
        <span>Reduced motion</span>
        <input
          type="checkbox"
          checked={settings.reducedMotion}
          onChange={(e) => update({ reducedMotion: e.target.checked })}
        />
      </label>
      <label className="toggle">
        <span>Diagnostics</span>
        <input
          type="checkbox"
          checked={settings.diagnostics}
          onChange={(e) => update({ diagnostics: e.target.checked })}
        />
      </label>
      <div className="notice">
        <Layers size={20} />
        <p>
          Your {save.owned.length} cards and {save.coins} coins are saved on
          this device. Online showcases are public; the server currently
          provides social storage, not cross-device ownership or verified
          balances.
        </p>
      </div>
      <button
        className="secondary full"
        onClick={() => {
          const blob = new Blob([JSON.stringify(save, null, 2)], {
              type: "application/json",
            }),
            url = URL.createObjectURL(blob),
            link = document.createElement("a");
          link.href = url;
          link.download = "packverse-backup.json";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        EXPORT COLLECTION BACKUP
      </button>
      <p className="fine-print">
        PACKVERSE 1.0 · {networkStatus}
        <br />
        TCGdex data. Pokémon artwork is temporary prototype content.
        <br />
        Build and asset credits are included in the repository.
      </p>
    </div>
  );
}
