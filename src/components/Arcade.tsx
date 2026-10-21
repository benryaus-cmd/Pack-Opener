import { useEffect, useRef, useState, type CSSProperties } from "react";
import { generateId } from "../game/uuid";
import { Coins, Eye, Sparkles } from "lucide-react";
import type { Game } from "../services/useGame";
import {
  ARCADE_STAKE,
  arcadeResult,
  playArcade,
  type ArcadeKind,
  type ArcadeResult,
} from "../game/arcade";
import { audio } from "../services/audio";
import "../styles/arcade.css";
const symbols = ["✦", "◈", "●"];
export function Arcade({ game, onStudy }: { game: Game; onStudy: () => void }) {
  const [kind, setKind] = useState<ArcadeKind>("slots");
  const [result, setResult] = useState<ArcadeResult>();
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const active = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  async function play() {
    if (lock.current || game.busy) return;
    lock.current = true;
    setPlaying(true);
    setError("");
    const id = generateId();
    try {
      // Debit and payout are persisted together before the visual reveal.
      const saved = await game.update((save) => playArcade(save, kind, id));
      if (!active.current) return;
      setResult(arcadeResult(saved, id));
      audio.play("coin");
      timer.current = setTimeout(() => {
        if (active.current) setPlaying(false);
        lock.current = false;
      }, 850);
    } catch (e) {
      lock.current = false;
      if (active.current) {
        setPlaying(false);
        setError((e as Error).message);
      }
    }
  }
  const displayed = result?.kind === kind ? result : undefined;
  const path =
    displayed?.kind === "drop"
      ? displayed.values
          .reduce(
            (points, direction, index) => [
              ...points,
              [
                150 +
                  displayed.values
                    .slice(0, index + 1)
                    .reduce((x, d) => x + (d ? 30 : -30), 0),
                37 + index * 31,
              ],
            ],
            [[150, 8]],
          )
          .map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`)
          .join(" ")
      : "M150 8 L150 130";
  return (
    <div className="arcade-panel">
      <span className="eyebrow">THE COLLECTOR’S ARCADE</span>
      <h2>A little luck. A sharper eye.</h2>
      <p>
        Play for pack coins. Virtual coins only, with no cash value or cash
        prizes.
      </p>
      <button className="arcade-study" onClick={onStudy}>
        <Eye size={24} />
        <span>
          <b>Collector’s Eye</b>
          <small>Six pairs · three lives · free to play</small>
        </span>
        <strong>
          +25 <Coins size={14} />
        </strong>
      </button>
      <div className="arcade-tabs" role="tablist" aria-label="Coin games">
        <button
          role="tab"
          aria-selected={kind === "slots"}
          disabled={playing}
          onClick={() => {
            setKind("slots");
            setError("");
          }}
        >
          LUCKY REELS
        </button>
        <button
          role="tab"
          aria-selected={kind === "drop"}
          disabled={playing}
          onClick={() => {
            setKind("drop");
            setError("");
          }}
        >
          COIN DROP
        </button>
      </div>
      <div className={`arcade-machine ${playing ? "is-playing" : ""}`}>
        {kind === "slots" ? (
          <div
            className="arcade-reels"
            aria-label={
              displayed
                ? `Reels: ${displayed.values.map((v) => symbols[v]).join(" ")}`
                : "Three reels ready"
            }
          >
            {(displayed?.values ?? [0, 1, 2]).map((value, i) => (
              <span key={i}>{symbols[value]}</span>
            ))}
          </div>
        ) : (
          <div className="arcade-drop">
            <svg
              viewBox="0 0 300 156"
              role="img"
              aria-label={
                displayed
                  ? `Ball landed in bin ${displayed.values.reduce((a, b) => a + b, 0) + 1}`
                  : "Ball drop board with five payout bins"
              }
            >
              {[0, 1, 2, 3].flatMap((row) =>
                Array.from({ length: row + 2 }, (_, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={150 - (row + 1) * 30 + col * 60}
                    cy={30 + row * 31}
                    r="3"
                    className="arcade-peg"
                  />
                )),
              )}
              {displayed && (
                <>
                  <path d={path} className="arcade-trail" />
                  <circle
                    r="7"
                    className="arcade-ball"
                    style={{ offsetPath: `path('${path}')` } as CSSProperties}
                  />
                </>
              )}
            </svg>
            <div className="arcade-bins">
              {[12, 8, 0, 8, 12].map((payout, i) => (
                <span
                  key={i}
                  className={
                    displayed &&
                    displayed.values.reduce((a, b) => a + b, 0) === i
                      ? "landed"
                      : ""
                  }
                >
                  {payout}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="arcade-result" role="status" aria-live="polite">
          {displayed ? (
            <>
              PAYOUT <b>{displayed.payout} COINS</b>
              <small>
                {displayed.payout >= ARCADE_STAKE ? "+" : ""}
                {displayed.payout - ARCADE_STAKE} after your {ARCADE_STAKE}-coin
                play
              </small>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Every play costs {ARCADE_STAKE} coins</span>
            </>
          )}
        </div>
        <button
          className="primary full"
          disabled={playing || game.busy || game.save!.coins < ARCADE_STAKE}
          onClick={() => void play()}
        >
          {playing ? "REVEALING…" : kind === "slots" ? "SPIN" : "DROP BALL"}{" "}
          <Coins size={15} /> {ARCADE_STAKE}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <details className="arcade-odds">
        <summary>How it works & exact odds</summary>
        {kind === "slots" ? (
          <p>
            Three independent reels, each with three equally likely symbols.
            Three matching: 15 coins (3/27). Exactly one pair: 6 coins (18/27).
            All different: 0 (6/27). Average payout: 5.67 coins per 5-coin play.
          </p>
        ) : (
          <p>
            Four independent left/right bounces, each 50/50. Bins from left to
            right pay 12, 8, 0, 8, 12 coins. Their chances are 1/16, 4/16, 6/16,
            4/16, 1/16. Average payout: 5.5 coins per 5-coin play.
          </p>
        )}
        <p>
          Payout includes your stake. Outcomes settle to your saved balance
          immediately, including if you close or refresh during the animation.
          No purchase is needed; Collector’s Eye is always free.
        </p>
      </details>
    </div>
  );
}
