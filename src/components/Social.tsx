import { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Globe,
  Heart,
  Link,
  Lock,
  MessageCircle,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import type { Game } from "../services/useGame";
import type { Collector } from "../services/protocol";
import { multiplayer } from "../services/multiplayer";
import { DEFAULT_HOST } from "../services/protocol";
import { cardById } from "../game/catalogue";
import { level } from "../game/engine";
import { CardView } from "./CardView";
import { Trades } from "./Trades";
import { trading } from "../services/trading";
export function Social({
  game,
  onInspect,
  initialTab = "lounge",
}: {
  game: Game;
  initialTab?: string;
  onInspect: (id: string) => void;
}) {
  const network = useSyncExternalStore(
    multiplayer.subscribe,
    multiplayer.snapshot,
  );
  const [tab, setTab] = useState(initialTab);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [host, setHost] = useState(() => {
    try {
      return localStorage.getItem("packverse-host") || DEFAULT_HOST;
    } catch {
      return DEFAULT_HOST;
    }
  });
  const [room, setRoom] = useState("lobby");
  const [editing, setEditing] = useState(false);
  const [period, setPeriod] = useState<"daily" | "all-time">("daily");
  const [leaders, setLeaders] = useState<any[] | null>(null);
  const [search, setSearch] = useState("");
  const [found, setFound] = useState<Collector | null>(null);
  const [selected, setSelected] = useState<Collector | null>(null);
  const online = network.status === "online";
  const profile = game.profile!;
  const save = game.save!;
  const peers = Object.values(network.peers);
  const own = {
    profile,
    level: level(save.xp),
    cards: save.owned.length,
    unique: new Set(save.owned.map((c) => c.cardId)).size,
    showcase: save.showcase
      .map((id) => save.owned.find((c) => c.instanceId === id)?.cardId)
      .filter((x): x is string => !!x),
  };
  async function act(fn: () => Promise<unknown>, message = "") {
    setSending(true);
    setError("");
    setNotice("");
    try {
      await fn();
      if (message) setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  function connect() {
    try {
      const url = new URL(host);
      if (
        url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        )
      )
        throw Error("Use an HTTPS server address");
      if (!/^[a-zA-Z0-9_-]{1,32}$/.test(room))
        throw Error("Room: 1–32 letters, numbers, underscores or dashes");
      localStorage.setItem("packverse-host", url.origin);
      multiplayer.connect(url.origin, room);
      setEditing(false);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function loadLeaders(value = period) {
    setPeriod(value);
    await act(async () => {
      const r = await multiplayer.leaderboard(value);
      setLeaders(Array.isArray(r.players) ? r.players : []);
    });
  }
  return (
    <div className="page social-page">
      <div className="connection-card">
        <div className="connection-copy">
          <span className={`connection-light ${online ? "on" : ""}`} />
          <div>
            <b>
              {online
                ? `LIVE · ${room.toUpperCase()}`
                : network.status === "connecting"
                  ? "CONNECTING…"
                  : network.status === "retrying"
                    ? "RECONNECTING…"
                    : "SOLO, FOR NOW"}
            </b>
            <small>
              {online
                ? `${peers.length + 1} collector${peers.length ? "s" : ""} here · Game 2`
                : "Your collection is always with you."}
            </small>
          </div>
        </div>
      </div>
      <button
        className="server-edit text-button"
        onClick={() => setEditing((v) => !v)}
      >
        <Link size={12} /> SERVER & ROOM
      </button>
      {editing && (
        <div className="server-form">
          <label>
            Server host
            <input
              aria-label="Multiplayer server"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </label>
          <label>
            Room
            <input
              aria-label="Multiplayer room"
              maxLength={32}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </label>
          <button className="secondary full" onClick={connect}>
            CONNECT TO GAME 2
          </button>
        </div>
      )}
      {(error || network.error) && (
        <p className="inline-error" role="alert">
          {error || network.error}
        </p>
      )}
      {notice && (
        <p className="success-notice" role="status">
          {notice}
        </p>
      )}
      <div className="tabs social-tabs">
        {[
          ["lounge", "Lounge"],
          ["collectors", "Collectors"],
          ["ranks", "Rankings"],
          ["exchange", "Trades"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              if (id === "ranks") void loadLeaders();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "lounge" && (
        <>
          <div className="section-title">
            <h2>
              <Radio size={16} /> Fresh pulls
            </h2>
            <span className="eyebrow">LIVE ACTIVITY</span>
          </div>
          {network.feed.length ? (
            <div className="activity-feed">
              {network.feed.map((f) => {
                const card = cardById.get(f.cardId);
                return card ? (
                  <button
                    className="activity-item"
                    key={f.id}
                    onClick={() => onInspect(card.id)}
                  >
                    <div>
                      <CardView card={card} finish="holo" />
                    </div>
                    <span>
                      <b>{f.name}</b> discovered
                      <strong>
                        {card.name} <Sparkles size={12} />
                      </strong>
                    </span>
                  </button>
                ) : null;
              })}
            </div>
          ) : (
            <div className="empty-inline">
              <Sparkles size={22} />
              <p>
                {online
                  ? "Waiting for something extraordinary."
                  : "Real pulls. Real collectors."}
                <br />
                <span>
                  {online
                    ? "Rare pulls in this room appear here."
                    : "Rare pulls appear automatically when connected."}
                </span>
              </p>
            </div>
          )}
          <div className="section-title">
            <h2>
              <MessageCircle size={16} /> Room chat
            </h2>
            <span className="eyebrow">{network.messages.length} MESSAGES</span>
          </div>
          <div className="chat-log" aria-live="polite">
            {!network.messages.length && (
              <p className="chat-empty">
                {online
                  ? "Be the first to say hello."
                  : "Connect to see the conversation."}
              </p>
            )}
            {network.messages.map((m) => (
              <div
                className={`chat-message ${m.playerId === profile.playerId ? "own" : ""}`}
                key={m.id}
              >
                <Avatar
                  profile={{
                    ...profile,
                    avatar: m.avatar ?? "",
                    nickName: m.name,
                  }}
                />
                <div>
                  <strong>
                    {m.name}
                    <time>
                      {new Date(m.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </strong>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                await multiplayer.chat(text);
                setText("");
              });
            }}
          >
            <input
              aria-label="Chat message"
              placeholder={online ? "Share the excitement…" : "Reconnecting…"}
              maxLength={280}
              value={text}
              disabled={!online}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="icon-button"
              type="submit"
              aria-label="Send message"
              disabled={!online || !text.trim() || sending}
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
      {tab === "collectors" && (
        <>
          <button className="collector-row" onClick={() => setSelected(own)}>
            <Avatar profile={profile} />
            <span>
              <b>
                {profile.nickName} <small>YOU</small>
              </b>
              <small>
                LV. {own.level} · {own.unique} discoveries
              </small>
            </span>
            <ChevronRight size={18} />
          </button>
          <button
            className="secondary full"
            disabled={sending || !online}
            onClick={() =>
              void act(
                () => multiplayer.publish(),
                "Showcase and collection score published.",
              )
            }
          >
            <Globe size={15} /> PUBLISH SHOWCASE & SCORE
          </button>
          <p className="fine-print">
            Public profile · collection score is client-submitted. Your binder
            and coins remain on this device.
          </p>
          <div className="section-title">
            <h2>In the room</h2>
            <Users size={17} />
          </div>
          {peers.map((c) => (
            <button
              className="collector-row"
              key={c.profile.playerId}
              onClick={() => setSelected(c)}
            >
              <Avatar profile={c.profile} />
              <span>
                <b>{c.profile.nickName}</b>
                <small>
                  LV. {c.level} · {c.cards} cards
                </small>
              </span>
              {save.friends.includes(c.profile.playerId) ? (
                <Heart size={17} />
              ) : (
                <ChevronRight size={17} />
              )}
            </button>
          ))}
          {!peers.length && (
            <div className="empty-inline">
              <Users />
              <p>
                No other collectors here yet.
                <br />
                <span>Invite someone to the same server and room.</span>
              </p>
            </div>
          )}
          <div className="section-title">
            <h2>Find a collector</h2>
            <Search size={16} />
          </div>
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const c = await multiplayer.findProfile(search.trim());
                setFound(c);
                setSelected(c);
              });
            }}
          >
            <input
              aria-label="Collector ID"
              value={search}
              placeholder="Paste their collector ID"
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="icon-button"
              aria-label="Find collector"
              disabled={sending}
            >
              <Search size={18} />
            </button>
          </form>
          <button
            className="text-button"
            onClick={() =>
              void navigator.clipboard
                ?.writeText(profile.playerId)
                .then(() => setNotice("Collector ID copied."))
            }
          >
            <Copy size={13} /> COPY MY COLLECTOR ID
          </button>
          {save.friends.length > 0 && (
            <>
              <h3>Saved collectors</h3>
              {save.friends.map((id) => (
                <button
                  className="friend-id"
                  key={id}
                  onClick={() =>
                    void act(async () =>
                      setSelected(await multiplayer.findProfile(id)),
                    )
                  }
                >
                  <Heart size={13} />
                  <span>{id}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </>
          )}
        </>
      )}
      {tab === "ranks" && (
        <>
          <div className="ranking-period">
            <button
              className={period === "daily" ? "active" : ""}
              onClick={() => void loadLeaders("daily")}
            >
              DAILY UTC
            </button>
            <button
              className={period === "all-time" ? "active" : ""}
              onClick={() => void loadLeaders("all-time")}
            >
              ALL TIME
            </button>
            <button
              className="icon-button"
              aria-label="Refresh rankings"
              onClick={() => void loadLeaders()}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="rank-header">
            <Trophy size={30} />
            <h2>Discovery club.</h2>
            <p>Unique cards · published by collectors</p>
          </div>
          {leaders?.map((p, i) => (
            <div className="leader-row" key={p.playerId}>
              <span>{p.rank ?? i + 1}</span>
              <Avatar
                profile={{
                  ...profile,
                  avatar: p.avatar ?? "",
                  nickName: p.name ?? "Collector",
                }}
              />
              <b>{p.name}</b>
              <strong>{p.score}</strong>
            </div>
          ))}
          {leaders?.length === 0 && (
            <div className="empty-state">
              <Trophy />
              <p>No published scores for this period.</p>
            </div>
          )}
          {leaders === null && !sending && (
            <div className="empty-state">
              <Globe />
              <p>
                Rankings couldn’t load.
                <br />
                Connect to the server and refresh.
              </p>
            </div>
          )}
          {sending && <p>Loading the discovery club…</p>}
          <button
            className="secondary full"
            disabled={!online || sending}
            onClick={() =>
              void act(
                () => multiplayer.publish(),
                "Collection score published. Refresh to see your rank.",
              )
            }
          >
            <Trophy size={15} /> PUBLISH MY COLLECTION SCORE
          </button>
          <p className="fine-print">
            Client-submitted scores · personal bests · daily resets at 00:00
            UTC.
          </p>
        </>
      )}
      {tab === "exchange" && <Trades game={game} />}
      {selected && (
        <div className="profile-drawer">
          <div className="profile-drawer-header">
            <Avatar profile={selected.profile} />
            <div>
              <h3>{selected.profile.nickName}</h3>
              <small>
                @{selected.profile.username} · LV. {selected.level}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Close collector profile"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </div>
          <div className="stat-strip">
            <div>
              <b>{selected.cards}</b>
              <span>CARDS</span>
            </div>
            <div>
              <b>{selected.unique}</b>
              <span>DISCOVERIES</span>
            </div>
          </div>
          {selected.profile.playerId !== profile.playerId &&
            peers.some(
              (c) => c.profile.playerId === selected.profile.playerId,
            ) && (
              <button
                className="primary full"
                onClick={() => {
                  try {
                    trading.invite(selected.profile.playerId);
                    setSelected(null);
                    setTab("exchange");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                OFFER TRADE
              </button>
            )}
          <div className="profile-showcase">
            {selected.showcase.map((id, i) => (
              <button key={id + i} onClick={() => onInspect(id)}>
                <CardView card={cardById.get(id)} finish="holo" />
              </button>
            ))}
            {!selected.showcase.length && (
              <p>No showcase cards selected yet.</p>
            )}
          </div>
          {selected.profile.playerId !== profile.playerId && (
            <button
              className="secondary full"
              onClick={() =>
                void game
                  .update((s) => ({
                    ...s,
                    friends: s.friends.includes(selected.profile.playerId)
                      ? s.friends.filter(
                          (id) => id !== selected.profile.playerId,
                        )
                      : [...s.friends, selected.profile.playerId],
                  }))
                  .catch(() => {})
              }
            >
              <Heart size={15} />
              {save.friends.includes(selected.profile.playerId)
                ? "REMOVE SAVED COLLECTOR"
                : "SAVE COLLECTOR"}
            </button>
          )}
          <small className="fine-print">
            Client-asserted profile · unverified
          </small>
        </div>
      )}
    </div>
  );
}
function CoinsIcon() {
  return <span className="coins-icon">◈</span>;
}
export function Avatar({
  profile,
}: {
  profile: { nickName: string; avatar: string };
}) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="avatar">
      {profile.avatar && !broken ? (
        <img src={profile.avatar} alt="" onError={() => setBroken(true)} />
      ) : (
        profile.nickName.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
