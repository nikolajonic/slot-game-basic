import React from "react";

type Props = {
  total: number;
  onClose: () => void;
};

const BonusSummaryModal: React.FC<Props> = ({ total, onClose }) => {
  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>FEATURE GAME OVER</h3>

        <div style={styles.modalBody}>
          <p style={styles.label}>Your win:</p>
          <p style={styles.amount}>{total.toFixed(2)}</p>
        </div>

        <button style={styles.modalBtn} onClick={onClose}>
          Collect
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,.35)",
    backdropFilter: "blur(8px)",
    zIndex: 50,
  },

  modal: {
    width: 420,
    height: 360,
    borderRadius: 18,
    overflow: "hidden",
    backgroundImage:
      'url("/basic-slot-game/assets/backgrounds/feature-game-start-background.png")',
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    color: "white",
    textShadow: "0 2px 8px rgba(0,0,0,.55)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    textAlign: "center",
    padding: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 0.3,
    margin: 0,
  },

  modalBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },

  label: {
    fontSize: 16,
    opacity: 0.95,
    margin: 0,
  },

  amount: {
    fontSize: 48,
    fontWeight: 900,
    color: "#facc15",
    margin: 0,
    textShadow: "0 3px 6px rgba(0,0,0,0.6)",
  },

  modalBtn: {
    display: "block",
    margin: "8px auto 0",
    width: "50%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
    color: "white",
    fontWeight: 900,
    letterSpacing: 0.5,
    cursor: "pointer",
  },
};

export default BonusSummaryModal;
