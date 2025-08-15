import React from "react";

type Props = {
  currentIndex: number;
  total: number;
  totalWin: number;
};

const TopBar: React.FC<Props> = ({ currentIndex, total, totalWin }) => {
  return (
    <div style={styles.wrap}>
      <span style={styles.spins}>
        {currentIndex} / {total} spins
      </span>
      <span style={styles.separator}>•</span>
      <span style={styles.total}>
        Total win: <b>{fmt(totalWin)}</b>
      </span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 18,
    fontWeight: 500,
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
  },
  spins: {
    color: "#facc15",
    fontWeight: 700,
  },
  separator: {
    opacity: 0.6,
  },
  total: {
    color: "#4ade80",
    fontWeight: 700,
  },
};

const fmt = (n: number) => `${n.toFixed(2)}`;

export default TopBar;
