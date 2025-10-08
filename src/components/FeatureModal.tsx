import React from "react";

type Props = {
  onStart: () => void;
  numberOfSpins: number;
};

const FeatureModal: React.FC<Props> = ({ onStart, numberOfSpins }) => {
  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>FEATURE GAME!</h3>

        <div style={styles.modalBody}>
          <p>
            You won <b>{numberOfSpins} Free Spins</b>.
          </p>
          <p>
            Multipliers <b>sum</b> and boost your wins during the feature.
          </p>
        </div>

        <button style={styles.modalBtn} onClick={onStart}>
          Start
        </button>
      </div>
    </div>
  );
};
const isMobile = window.innerWidth < 768;
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
    width: isMobile ? 320 : 420,
    height: isMobile ? 280 : 360,
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
    gap: 16, // space between title, body, and button
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
    fontSize: 14,
    lineHeight: 1.4,
    margin: 0,
  },

  modalBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
    color: "white",
    fontWeight: 900,
    letterSpacing: 0.5,
    cursor: "pointer",
    width: "50%",
  },
};

export default FeatureModal;
