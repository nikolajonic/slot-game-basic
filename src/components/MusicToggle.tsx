import React from "react";

type Props = {
  on: boolean;
  onToggle: () => void;
};

const MusicToggle: React.FC<Props> = ({ on, onToggle }) => {
  return (
    <div style={styles.wrap}>
      <button
        onClick={onToggle}
        title={on ? "Mute music" : "Unmute music"}
        aria-label={on ? "Mute music" : "Unmute music"}
        style={styles.btn}
      >
        {on ? (
          <svg width="22" height="22" viewBox="0 0 24 24" style={styles.svg}>
            <path d="M4 10v4h3l5 4V6l-5 4H4z" fill="currentColor" />
            <path
              d="M16 8a4 4 0 010 8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" style={styles.svg}>
            <path d="M4 10v4h3l5 4V6l-5 4H4z" fill="currentColor" />
            <path
              d="M19 5L5 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: "absolute", top: 8, right: 8, zIndex: 60 },
  btn: {
    width: 50,
    height: 50,
    padding: 0,
    lineHeight: 0,
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255, 255, 255, 0.33)",
    color: "white",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    appearance: "none",
  },
  svg: { display: "block", pointerEvents: "none" },
};

export default MusicToggle;
