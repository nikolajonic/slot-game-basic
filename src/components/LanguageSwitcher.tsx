import React from "react";
import { useTranslation } from "react-i18next";

const languages = [
  {
    code: "en",
    label: "English",
    flag: "/basic-slot-game/assets/languages/united-kingdom.png",
  },
  {
    code: "sr",
    label: "Serbian",
    flag: "/basic-slot-game/assets/languages/serbia.png",
  },
  {
    code: "it",
    label: "Italian",
    flag: "/basic-slot-game/assets/languages/italy.png",
  },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            style={styles.button}
            title={lang.label}
          >
            <img src={lang.flag} alt={lang.label} style={styles.flag} />
          </button>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: "absolute", top: 8, right: 50, zIndex: 2 },
  container: {
    display: "flex",
    gap: 8,
    margin: "16px 0",
    justifyContent: "center",
  },
  button: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
  flag: {
    width: 28,
    height: 20,
  },
};

export default LanguageSwitcher;
