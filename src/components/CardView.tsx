import { useRef, useState, type CSSProperties } from "react";
import type { CardDefinition, Finish } from "../game/types";
import { imageUrl } from "../game/catalogue";
import { Sparkles } from "lucide-react";
export function CardView({
  card,
  finish = "matte",
  interactive = false,
  back = false,
  large = false,
  onClick,
  className = "",
}: {
  card?: CardDefinition;
  finish?: Finish;
  interactive?: boolean;
  back?: boolean;
  large?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [highLoaded, setHighLoaded] = useState(false);
  function tilt(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive || !ref.current) return;
    const r = ref.current.getBoundingClientRect(),
      x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    ref.current.style.setProperty("--rx", `${(0.5 - y) * 22}deg`);
    ref.current.style.setProperty("--ry", `${(x - 0.5) * 24}deg`);
    ref.current.style.setProperty("--mx", `${x * 100}%`);
    ref.current.style.setProperty("--my", `${y * 100}%`);
  }
  function reset() {
    if (!ref.current) return;
    ref.current.style.setProperty("--rx", "0deg");
    ref.current.style.setProperty("--ry", "0deg");
  }
  return (
    <div
      ref={ref}
      className={`card-view ${back ? "card-back" : ""} finish-${finish} ${interactive ? "interactive" : ""} ${className}`}
      style={{ "--card-hue": `${(card?.tier ?? 0) * 48}deg` } as CSSProperties}
      onPointerMove={tilt}
      onPointerLeave={reset}
      onPointerUp={reset}
      onClick={onClick}
    >
      {back ? (
        <div className="back-design">
          <div className="back-orbit" />
          <Sparkles />
          <b>PACKVERSE</b>
          <small>EVERY CARD. A POSSIBILITY.</small>
        </div>
      ) : (
        <>
          {card?.image && !failed && (
            <img
              src={imageUrl(card)}
              alt={card.name}
              loading={large ? "eager" : "lazy"}
              draggable={false}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          )}
          {large && card?.image && (
            <img
              className="high-resolution"
              src={`${card.image}/high.webp`}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{ opacity: highLoaded ? 1 : 0 }}
              onLoad={() => setHighLoaded(true)}
            />
          )}
          {(!loaded || failed || !card?.image) && (
            <div className={`card-fallback type-${card?.type.toLowerCase()}`}>
              <small>
                {card?.localId} / {card?.setId.toUpperCase()}
              </small>
              <Sparkles />
              <b>{card?.name ?? "Undiscovered"}</b>
              <span>
                {failed
                  ? "Artwork unavailable"
                  : (card?.rarity ?? "YOUR NEXT DISCOVERY")}
              </span>
            </div>
          )}
          <div className="foil" />
          <div className="card-glare" />
          <div className="card-grain" />
        </>
      )}
    </div>
  );
}
