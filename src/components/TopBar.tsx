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
const isMobile = window.innerWidth < 768;
const styles: Record<string, React.CSSProperties> = {
  wrap: {
    alignItems: "center",
    gap: 8,
    fontWeight: 500,
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
    position: "absolute",
    top: -30,
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
  },
  spins: {
    color: "#facc15",
    fontWeight: 700,
    fontSize: isMobile ? 12 : 26,
  },
  separator: {
    opacity: 0.6,
    margin: 5,
  },
  total: {
    color: "#4ade80",
    fontWeight: 700,
    fontSize: isMobile ? 12 : 26,
  },
};

const fmt = (n: number) => `${n.toFixed(2)}`;

export default TopBar;
