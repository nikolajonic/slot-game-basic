import React from "react";

type Props = {
  disabled: boolean;
  label: string;
  onClick: () => void;
};

const SpinButton: React.FC<Props> = ({ disabled, label, onClick }) => {
  return (
    <div style={styles.wrap}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...styles.btn,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        title={label}
      >
        {disabled ? "…" : label}
      </button>
    </div>
  );
};
const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "grid", placeItems: "center" },
  btn: {
    width: 66,
    height: 66,
    borderRadius: "50%",
    border: "none",
    background:
      "radial-gradient(circle at 50% 35%, rgba(59,130,246,1) 0%, rgba(37,99,235,1) 75%)",
    color: "white",
    fontWeight: 900,
    fontSize: 18,
    letterSpacing: 1,
    boxShadow: "0 12px 30px rgba(59,130,246,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default SpinButton;
