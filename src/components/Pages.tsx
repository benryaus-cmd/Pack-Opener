import {
  products,
  productById,
  productCost,
  guaranteeLabel,
} from "../game/products";
import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Coins,
  Gift,
  Layers,
  Lock,
  Search,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { Game } from "../services/useGame";
import type { SetDefinition } from "../game/types";
import { sets, heroCard, cardById, totalCards } from "../game/catalogue";
import {
  claimDaily,
  level,
  levelProgress,
  missions,
  utcDay,
} from "../game/engine";
import { BoosterPack } from "./BoosterPack";
import { CardView } from "./CardView";
type ReadyGame = Game & {
  save: NonNullable<Game["save"]>;
  profile: NonNullable<Game["profile"]>;
};
export function Home({
  game,
  onBuy,
  onMissions,
  onCards,
}: {
  game: ReadyGame;
  onBuy: (s: SetDefinition) => void;
  onMissions: () => void;
  onCards: () => void;
}) {
  const s = game.save;
  const starter = sets[0];
  const unique = new Set(s.owned.map((c) => c.cardId)).size;
  const recent = [...s.owned].reverse().slice(0, 5);
  return (
    <div className="page home-page">
      <div className="section-label">
        <span>
          <i className="status-dot" /> YOUR DAILY DOSE OF DISCOVERY
        </span>
        <Sparkles size={14} />
      </div>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">THE ORIGINAL OBSESSION</span>
          <h1>
            Crack the
            <br />
            <em>extraordinary.</em>
          </h1>
          <p>
            That first pull feeling.
            <br />
            All over again.
          </p>
        </div>
        <div className="hero-display">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-floating-card card-left">
            <CardView card={heroCard(sets[1])} finish="holo" />
          </div>
          <div className="hero-floating-card card-right">
            <CardView card={heroCard(starter)} finish="holo" />
          </div>
          <BoosterPack set={starter} small />
          <span className="hero-spark s1">✦</span>
          <span className="hero-spark s2">✧</span>
          <span className="hero-edition">
            EST. 1999
            <br />
            REDISCOVERED. FOREVER.
          </span>
        </div>
        <div className="hero-bottom">
          <div>
            <span className="eyebrow">KANTO · BASE SET</span>
            <strong>The one that started it all.</strong>
          </div>
          <span className="pill">5 CARDS</span>
        </div>
        <button
          className="primary"
          onClick={() => onBuy(starter)}
          disabled={game.busy}
        >
          {s.pending ? "CONTINUE YOUR PACK" : "OPEN ORIGIN BOOSTER"}{" "}
          <span>
            <Coins size={15} /> {s.pending ? "→" : starter.price}
          </span>
        </button>
        <small className="prototype-note">
          Prototype packs · one rare or better guaranteed
        </small>
      </section>
      <div className="stat-strip">
        <div>
          <b>{unique}</b>
          <span>DISCOVERED</span>
        </div>
        <div>
          <b>{s.owned.length}</b>
          <span>CARDS OWNED</span>
        </div>
        <div>
          <b>
            {
              sets.filter((set) =>
                set.cards.every((c) => s.owned.some((o) => o.cardId === c.id)),
              ).length
            }
            <small> / 9</small>
          </b>
          <span>SETS COMPLETE</span>
        </div>
      </div>
      <div className="home-actions">
        <button
          className="daily-tile"
          disabled={s.lastClaim === utcDay() || game.busy}
          onClick={() => void game.update((x) => claimDaily(x)).catch(() => {})}
        >
          <span className="tile-icon">
            <Gift size={21} />
          </span>
          <span>
            <b>
              {s.lastClaim === utcDay()
                ? "See you tomorrow"
                : "A little something."}
            </b>
            <small>
              {s.lastClaim === utcDay()
                ? `${s.streak} DAY STREAK`
                : "DAILY GIFT · 100 COINS"}
            </small>
          </span>
          <span className="tile-arrow">
            {s.lastClaim === utcDay() ? (
              <Check size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </span>
        </button>
        <button className="mission-tile" onClick={onMissions}>
          <Target size={18} />
          <span>COLLECTOR MISSIONS</span>
          <b>
            {missions(s).filter((m) => m.value >= m.target && !m.claimed)
              .length || "→"}
          </b>
        </button>
      </div>
      <div className="section-title">
        <h2>
          {recent.length ? "Fresh from the foil" : "Your story starts here"}
        </h2>
        <button className="text-button" onClick={onCards}>
          YOUR BINDER <ArrowRight size={13} />
        </button>
      </div>
      {recent.length ? (
        <div className="recent-row">
          {recent.map((c) => (
            <div key={c.instanceId}>
              <CardView card={cardById.get(c.cardId)} finish={c.finish} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-inline">
          <Layers size={24} />
          <p>
            One pack. Five possibilities.
            <br />
            <span>Your first discoveries are waiting.</span>
          </p>
        </div>
      )}
      <div className="level-mini">
        <span>COLLECTOR LV. {level(s.xp)}</span>
        <div className="progress">
          <i style={{ width: `${levelProgress(s.xp) * 100}%` }} />
        </div>
        <span>{s.xp} XP</span>
      </div>
    </div>
  );
}
export function Shop({
  game,
  onBuy,
  onOdds,
}: {
  game: ReadyGame;
  onBuy: (s: SetDefinition, productId?: string) => void;
  onOdds: (s: SetDefinition, productId?: string) => void;
}) {
  const [era, setEra] = useState("All eras"),
    [query, setQuery] = useState(""),
    [productId, setProductId] = useState("standard");
  const product = productById(productId)!;
  const visible = sets.filter(
    (s) =>
      (era === "All eras" || s.era === era) &&
      (s.name + " " + s.era).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page shop-page">
      <div className="page-heading">
        <span className="eyebrow">THE BOOSTER ROOM</span>
        <h1>Pick your possibility.</h1>
        <p>Nine eras. A thousand reasons to rip.</p>
      </div>
      <div className="shop-tools">
        <label>
          CHOOSE YOUR EXPERIENCE
          <select
            aria-label="Pack product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.packs > 1 ? "3 × 5" : p.count} cards ·{" "}
                {p.cost || "FREE"} {p.cost ? "coins" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="search">
          <Search size={15} />
          <input
            aria-label="Search booster sets"
            placeholder="Search sets or eras…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="tabs era-tabs">
        <button
          className={era === "All eras" ? "active" : ""}
          onClick={() => setEra("All eras")}
        >
          All eras
        </button>
        {sets.map((s) => (
          <button
            className={era === s.era ? "active" : ""}
            onClick={() => setEra(s.era)}
            key={s.id}
          >
            {s.era}
          </button>
        ))}
      </div>
      <div className="shop-grid">
        {visible.map((set) => {
          const cost = productCost(product, set),
            claimed =
              product.id === "daily" && game.save.lastFreePack === utcDay(),
            discovered = new Set(
              game.save.owned
                .filter((o) => o.setId === set.id)
                .map((o) => o.cardId),
            ).size;
          return (
            <article
              className="shop-product"
              style={{ "--accent": set.color } as CSSProperties}
              key={set.id}
            >
              <div className="product-topline">
                <span>
                  VOL. {String(sets.indexOf(set) + 1).padStart(2, "0")}
                </span>
                <button
                  className="text-button"
                  onClick={() => onOdds(set, productId)}
                >
                  ODDS ↗
                </button>
              </div>
              <button
                className="product-art"
                aria-label={`View ${set.name} pack odds`}
                onClick={() => onOdds(set, productId)}
              >
                <BoosterPack set={set} small count={product.count} />
                {product.packs > 1 && <span className="bundle-badge">×3</span>}
              </button>
              <div className="product-label">
                <small>
                  {set.era.toUpperCase()} · {set.releaseDate.slice(0, 4)} ·{" "}
                  {set.total} CARDS
                </small>
                <h2>{set.name}</h2>
                <span>
                  {product.packs > 1 ? "3 × 5" : product.count} cards ·{" "}
                  {guaranteeLabel(product, set)}
                </span>
                <div className="progress">
                  <i style={{ width: `${(discovered / set.total) * 100}%` }} />
                </div>
                <span>
                  {discovered}/{set.total} discovered
                </span>
              </div>
              <button
                className="buy-button"
                onClick={() => onBuy(set, productId)}
                disabled={
                  game.busy ||
                  (!game.save.pending && (game.save.coins < cost || claimed))
                }
              >
                {game.save.pending ? (
                  "CONTINUE PACK"
                ) : claimed ? (
                  "CLAIMED TODAY"
                ) : (
                  <>
                    OPEN {product.packs > 1 ? "BUNDLE" : "PACK"}{" "}
                    <span>
                      {cost ? (
                        <>
                          <Coins size={14} />
                          {cost}
                        </>
                      ) : (
                        "FREE"
                      )}
                    </span>
                  </>
                )}
              </button>
              {game.save.coins < cost && !game.save.pending && (
                <small className="insufficient">
                  Earn more coins in Missions
                </small>
              )}
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <Search />
          <p>No sets match this search.</p>
        </div>
      )}
      <p className="fine-print">
        All products use disclosed prototype drop rates. Daily Free Pack: one
        per UTC day across all sets. A bundle contains three standard packs from
        your selected era’s featured set.
      </p>
    </div>
  );
}
export function Collection({
  game,
  onInspect,
}: {
  game: ReadyGame;
  onInspect: (id: string) => void;
}) {
  const [setId, setSetId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("number");
  const [limit, setLimit] = useState(60);
  const save = game.save;
  const counts = useMemo(() => {
    const m = new Map<string, typeof save.owned>();
    for (const c of save.owned)
      m.set(c.cardId, [...(m.get(c.cardId) ?? []), c]);
    return m;
  }, [save]);
  const set = sets.find((s) => s.id === setId);
  const ownedUnique = counts.size;
  const filtered = useMemo(() => {
    if (!set) return [];
    return set.cards
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) &&
          (filter === "all" ||
            (filter === "owned" && counts.has(c.id)) ||
            (filter === "missing" && !counts.has(c.id)) ||
            (filter === "duplicates" && (counts.get(c.id)?.length ?? 0) > 1) ||
            (filter === "favourites" &&
              counts
                .get(c.id)
                ?.some((o) => save.favourites.includes(o.instanceId)))),
      )
      .sort((a, b) =>
        sort === "rarity"
          ? b.tier - a.tier
          : sort === "recent"
            ? (counts.get(b.id)?.at(-1)?.obtainedAt ?? 0) -
              (counts.get(a.id)?.at(-1)?.obtainedAt ?? 0)
            : Number(a.localId) - Number(b.localId),
      );
  }, [set, query, filter, sort, counts, save]);
  return (
    <div className="page collection-page">
      {!set ? (
        <>
          <div className="page-heading">
            <span className="eyebrow">THE ARCHIVE</span>
            <h1>A universe. Yours.</h1>
            <p>Every discovery has a place.</p>
          </div>
          <div className="collection-overview">
            <div>
              <strong>
                {ownedUnique}
                <small> / {totalCards}</small>
              </strong>
              <span>UNIQUE CARDS</span>
            </div>
            <div
              className="completion-ring"
              style={
                {
                  "--percent": `${(ownedUnique / totalCards) * 360}deg`,
                } as CSSProperties
              }
            >
              <b>
                {((ownedUnique / totalCards) * 100).toFixed(1)}
                <small>%</small>
              </b>
            </div>
            <div className="progress">
              <i style={{ width: `${(ownedUnique / totalCards) * 100}%` }} />
            </div>
            <small>
              {save.owned.length} total copies ·{" "}
              {save.owned.length - ownedUnique} extra copies
            </small>
          </div>
          <div className="section-title">
            <h2>Your binders</h2>
            <span className="eyebrow">9 ERAS</span>
          </div>
          <div className="binder-list">
            {sets.map((s, i) => {
              const count = s.cards.filter((c) => counts.has(c.id)).length;
              return (
                <button
                  key={s.id}
                  className="binder-set"
                  style={{ "--accent": s.color } as CSSProperties}
                  onClick={() => {
                    setSetId(s.id);
                    setLimit(60);
                  }}
                >
                  <div className="binder-spine">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="binder-cover">
                    <CardView card={heroCard(s)} finish="holo" />
                  </div>
                  <div className="binder-info">
                    <span className="eyebrow">{s.era.toUpperCase()}</span>
                    <h2>{s.name}</h2>
                    <div className="progress">
                      <i style={{ width: `${(count / s.total) * 100}%` }} />
                    </div>
                    <small>
                      {count} / {s.total} discovered
                    </small>
                  </div>
                  <ChevronRight size={18} />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="binder-heading">
            <button
              className="icon-button"
              aria-label="Back to binders"
              onClick={() => setSetId(null)}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <span className="eyebrow">{set.era.toUpperCase()} ARCHIVE</span>
              <h1>{set.name}</h1>
            </div>
            <span className="pill">
              {set.cards.filter((c) => counts.has(c.id)).length}/{set.total}
            </span>
          </div>
          <div className="binder-tools">
            <div className="search">
              <Search size={15} />
              <input
                aria-label="Search cards"
                placeholder="Find a discovery…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(60);
                }}
              />
            </div>
            <div className="filter-row">
              <select
                aria-label="Card ownership filter"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setLimit(60);
                }}
              >
                <option value="all">All cards</option>
                <option value="owned">Owned</option>
                <option value="missing">Missing</option>
                <option value="duplicates">Duplicates</option>
                <option value="favourites">Favourites</option>
              </select>
              <select
                aria-label="Sort cards"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="number">Card number</option>
                <option value="rarity">Rarity</option>
                <option value="recent">Recent pulls</option>
              </select>
            </div>
          </div>
          <div className="binder-grid">
            {filtered.slice(0, limit).map((c) => {
              const copies = counts.get(c.id);
              return (
                <button
                  key={c.id}
                  className={`binder-slot ${copies ? "owned" : "missing"}`}
                  aria-label={`${c.name}, ${copies?.length ?? 0} owned`}
                  onClick={() => onInspect(copies?.[0].instanceId ?? c.id)}
                >
                  {copies ? (
                    <CardView card={c} finish={copies[0].finish} />
                  ) : (
                    <div className="missing-card">
                      <Sparkles />
                      <span>{c.localId.padStart(3, "0")}</span>
                      <small>UNDISCOVERED</small>
                    </div>
                  )}
                  <span className="slot-number">
                    {c.localId.padStart(3, "0")}
                  </span>
                  {copies && <b className="copy-count">×{copies.length}</b>}
                  <div className="slot-name">{c.name}</div>
                  <div className={`rarity-line tier-${c.tier}`} />
                </button>
              );
            })}
          </div>
          {!filtered.length && (
            <div className="empty-state">
              <Search />
              <h3>No cards in this view</h3>
              <p>Try a different filter or search.</p>
            </div>
          )}
          {filtered.length > limit && (
            <button
              className="secondary full"
              onClick={() => setLimit((n) => n + 60)}
            >
              LOAD MORE · {filtered.length - limit} REMAINING
            </button>
          )}
        </>
      )}
    </div>
  );
}
