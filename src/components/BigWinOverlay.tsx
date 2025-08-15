import React from "react";

type Props = {
  amount: number;
  factor: number;

  durationMs?: number;
};

const BigWinOverlay: React.FC<Props> = ({
  amount,
  factor,
  durationMs = 1200,
}) => {
  const [display, setDisplay] = React.useState(0);
  const [isCounting, setIsCounting] = React.useState(false);
  const [justFinished, setJustFinished] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

  React.useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsCounting(true);
    setJustFinished(false);

    const from = 0;
    const to = Math.max(0, amount);
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutQuint(t);
      const value = from + (to - from) * eased;

      const snapped = t > 0.98 ? to : value;
      setDisplay(snapped);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setIsCounting(false);
        setJustFinished(true);

        setTimeout(() => setJustFinished(false), 220);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [amount, durationMs]);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.title}>BIG WIN</div>

        <div
          style={{
            ...styles.amount,
            transform: isCounting
              ? "scale(1.02)"
              : justFinished
              ? "scale(1.08)"
              : "scale(1)",
            transition: "transform 140ms ease",
          }}
        >
          {fmt(display)}
        </div>

        <div style={styles.factor}>×{factor.toFixed(1)}</div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    background:
      "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.55) 100%)",
  },

  card: {
    minWidth: 280,
    padding: "16px 22px 18px",
    borderRadius: 16,
    background: "rgba(8,12,24,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    textAlign: "center",
    color: "white",
    transform: "translateZ(0)",
    backdropFilter: "blur(4px)",
  },

  title: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 1,
    opacity: 0.95,
    textShadow: "0 2px 6px rgba(0,0,0,0.55)",
  },

  amount: {
    marginTop: 6,
    fontSize: 48,
    fontWeight: 900,
    color: "#facc15",
    textShadow: "0 3px 8px rgba(0,0,0,0.6)",
  },

  factor: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 800,
    opacity: 0.9,
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
  },
};

export default BigWinOverlay;
