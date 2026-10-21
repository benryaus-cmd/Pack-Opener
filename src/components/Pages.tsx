import "../styles/collection-update.css";
import { achievements } from "../game/achievements";
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
  onEarn,
}: {
  game: ReadyGame;
  onBuy: (s: SetDefinition) => void;
  onMissions: () => void;
  onCards: () => void;
  onEarn?: () => void;
}) {
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return !localStorage.getItem("packverse-welcome-dismissed");
    } catch {
      return false;
    }
  });
  const dismissWelcome = () => {
    setShowWelcome(false);
    try {
      localStorage.setItem("packverse-welcome-dismissed", "1");
    } catch {
      /* Private browsing can disable storage. */
    }
  };
  const s = game.save;
  const starter = sets[0];
  const ownedIds = useMemo(
    () => new Set(s.owned.map((c) => c.cardId)),
    [s.owned],
  );
  const unique = ownedIds.size;
  const recent = [...s.owned].reverse().slice(0, 5);
  return (
    <div className="page home-page">
      <div className="section-label">
        <span>
          <i className="status-dot" /> YOUR DAILY DOSE OF DISCOVERY
        </span>
        <Sparkles size={14} />
      </div>
      {showWelcome && (
        <section
          className="home-hero welcome-splash"
          aria-label="Welcome to Packverse"
        >
          <button
            className="welcome-dismiss"
            aria-label="Dismiss welcome"
            onClick={dismissWelcome}
          >
            ×
          </button>
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
            onClick={() => {
              dismissWelcome();
              onBuy(starter);
            }}
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
      )}
      <section className="home-compact">
        <div>
          <span className="eyebrow">YOUR COLLECTOR CLUB</span>
          <h1>Ready for your next discovery?</h1>
          <p>Daily rewards, fresh pulls, and a binder full of possibility.</p>
        </div>
        <button
          className="primary"
          disabled={game.busy}
          onClick={() => onBuy(starter)}
        >
          {s.pending ? "CONTINUE YOUR PACK" : "OPEN A BOOSTER"}
          <ArrowRight size={16} />
        </button>
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
              sets.filter((set) => set.cards.every((c) => ownedIds.has(c.id)))
                .length
            }
            <small> / {sets.length}</small>
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
              .length +
              achievements(s, sets).filter(
                (a) => a.value >= a.target && !a.claimed,
              ).length || "→"}
          </b>
        </button>
        <button className="earn-coins-tile" onClick={onEarn ?? onMissions}>
          <Coins size={18} />
          <span>
            <b>EARN COINS</b>
            <small>Keep your next pack within reach</small>
          </span>
          <ChevronRight size={18} />
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
  const [shopLimit, setShopLimit] = useState(12);
  const eras = [...new Set(sets.map((s) => s.era))];
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
        <p>Nine eras. {sets.length} real expansions to discover.</p>
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
            onChange={(e) => {
              setQuery(e.target.value);
              setShopLimit(12);
            }}
          />
        </div>
      </div>
      <div className="tabs era-tabs">
        <button
          className={era === "All eras" ? "active" : ""}
          onClick={() => {
            setEra("All eras");
            setShopLimit(12);
          }}
        >
          All eras
        </button>
        {eras.map((name) => (
          <button
            className={era === name ? "active" : ""}
            onClick={() => {
              setEra(name);
              setShopLimit(12);
            }}
            key={name}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="shop-grid">
        {visible.slice(0, shopLimit).map((set) => {
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
      {visible.length > shopLimit && (
        <button
          className="secondary full"
          onClick={() => setShopLimit((n) => n + 12)}
        >
          MORE EXPANSIONS · {visible.length - shopLimit} REMAINING
        </button>
      )}
      {!visible.length && (
        <div className="empty-state">
          <Search />
          <p>No sets match this search.</p>
        </div>
      )}
      <p className="fine-print">
        All products use disclosed prototype drop rates. Daily Free Pack: one
        per UTC day across all sets. A bundle contains three standard packs from
        your selected expansion.
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
  const [era, setEra] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("number");
  const [limit, setLimit] = useState(60);
  const save = game.save;
  const eras = [...new Set(sets.map((s) => s.era))];
  const counts = useMemo(() => {
    const m = new Map<string, typeof save.owned>();
    for (const c of save.owned)
      m.set(c.cardId, [...(m.get(c.cardId) ?? []), c]);
    return m;
  }, [save.owned]);
  const eraSets = useMemo(
    () =>
      sets
        .filter((s) => s.era === era)
        .sort(
          (a, b) =>
            a.releaseDate.localeCompare(b.releaseDate) ||
            a.id.localeCompare(b.id),
        ),
    [era],
  );
  const filtered = useMemo(
    () =>
      eraSets.flatMap((set) => {
        const q = query.trim().toLowerCase();
        const cards = set.cards
          .filter(
            (c) =>
              `${c.name} ${c.localId} ${c.rarity} ${set.name}`
                .toLowerCase()
                .includes(q) &&
              (filter === "all" ||
                (filter === "owned" && counts.has(c.id)) ||
                (filter === "missing" && !counts.has(c.id)) ||
                (filter === "duplicates" &&
                  (counts.get(c.id)?.length ?? 0) > 1) ||
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
                : a.localId.localeCompare(b.localId, undefined, {
                    numeric: true,
                  }),
          );
        return cards.map((card) => ({ card, set }));
      }),
    [eraSets, query, filter, sort, counts, save.favourites],
  );
  const sections = useMemo(() => {
    const result: { set: SetDefinition; cards: typeof filtered }[] = [];
    for (const entry of filtered.slice(0, limit)) {
      let section = result.at(-1);
      if (!section || section.set.id !== entry.set.id) {
        section = { set: entry.set, cards: [] };
        result.push(section);
      }
      section.cards.push(entry);
    }
    return result;
  }, [filtered, limit]);
  const ownedUnique = counts.size;
  const eraTotal = eraSets.reduce((n, s) => n + s.cards.length, 0);
  const eraOwned = eraSets.reduce(
    (n, s) => n + s.cards.filter((c) => counts.has(c.id)).length,
    0,
  );
  return (
    <div className="page collection-page">
      {!era ? (
        <>
          <div className="page-heading">
            <span className="eyebrow">THE ARCHIVE</span>
            <h1>A universe. Yours.</h1>
            <p>Every era has a binder. Every expansion has its place.</p>
          </div>
          <div className="collection-overview">
            <div>
              <strong>
                {ownedUnique}
                <small> / {totalCards.toLocaleString()}</small>
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
            <h2>Your era binders</h2>
            <span className="eyebrow">
              {eras.length} ERAS · {sets.length} SETS
            </span>
          </div>
          <div className="binder-list">
            {eras.map((name, i) => {
              const grouped = sets.filter((s) => s.era === name);
              const total = grouped.reduce((n, s) => n + s.cards.length, 0);
              const count = grouped.reduce(
                (n, s) => n + s.cards.filter((c) => counts.has(c.id)).length,
                0,
              );
              const featured = grouped[0];
              return (
                <button
                  key={name}
                  className="binder-set"
                  style={{ "--accent": featured.color } as CSSProperties}
                  onClick={() => {
                    setEra(name);
                    setLimit(60);
                  }}
                >
                  <div className="binder-spine">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="binder-cover">
                    <CardView card={heroCard(featured)} finish="holo" />
                  </div>
                  <div className="binder-info">
                    <span className="eyebrow">{grouped.length} EXPANSIONS</span>
                    <h2>{name}</h2>
                    <div className="progress">
                      <i style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <small>
                      {count} / {total.toLocaleString()} discovered
                    </small>
                    <span className="binder-set-preview">
                      {grouped
                        .slice(0, 3)
                        .map((s) => s.name)
                        .join(" · ")}
                      …
                    </span>
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
              aria-label="Back to era binders"
              onClick={() => setEra(null)}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <span className="eyebrow">
                {eraSets.length} EXPANSIONS · IN RELEASE ORDER
              </span>
              <h1>{era} binder</h1>
            </div>
            <span className="pill">
              {eraOwned}/{eraTotal.toLocaleString()}
            </span>
          </div>
          <div className="binder-tools">
            <div className="search">
              <Search size={15} />
              <input
                aria-label="Search cards"
                placeholder="Search names, sets, numbers, rarity…"
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
          <nav className="binder-set-jump" aria-label="Jump to expansion">
            <label>
              EXPANSION{" "}
              <select
                aria-label="Jump to expansion"
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  const index = filtered.findIndex(
                    (entry) => entry.set.id === id,
                  );
                  if (index < 0) return;
                  setLimit((n) => Math.max(n, index + 60));
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                      document.getElementById(`binder-${id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      }),
                    ),
                  );
                }}
              >
                <option value="">Browse {eraSets.length} sets…</option>
                {eraSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.cards.length} cards
                  </option>
                ))}
              </select>
            </label>
            <span>{filtered.length.toLocaleString()} matching cards</span>
          </nav>
          {sections.map(({ set, cards }) => (
            <section
              className="binder-expansion"
              id={`binder-${set.id}`}
              key={set.id}
            >
              <div className="expansion-heading">
                <div>
                  <span className="eyebrow">
                    {set.releaseDate.slice(0, 4)} · {set.id.toUpperCase()}
                  </span>
                  <h2>{set.name}</h2>
                </div>
                <span>
                  {set.cards.filter((c) => counts.has(c.id)).length} /{" "}
                  {set.cards.length}
                </span>
              </div>
              <div className="binder-grid">
                {cards.map(({ card: c }) => {
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
            </section>
          ))}
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
              LOAD MORE · {(filtered.length - limit).toLocaleString()} REMAINING
            </button>
          )}
        </>
      )}
    </div>
  );
}
