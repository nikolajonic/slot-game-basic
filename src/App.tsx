import React from "react";
import PixiStage from "./pixi/PixiStage";
import { SlotEngine } from "./game/SlotEngine";
import MusicToggle from "./components/MusicToggle";
import TopBar from "./components/TopBar";
import BigWinOverlay from "./components/BigWinOverlay";
import BonusSummaryModal from "./components/BonusSummaryModal";
import FeatureModal from "./components/FeatureModal";
import SpinButton from "./components/SpinButton";
// import LanguageSwitcher from "./components/LanguageSwitcher"; // optional if you want it back

type AppState = {
  spinning: boolean;
  balance: number;
  bet: number;
  lastWin: number;
  totalSpinWin: number;

  // bonus UI
  showBonusPopup: boolean;
  freeSpinsLeft: number;
  bonusTotal: number;
  bonusSpinsTotal: number;

  // overlays
  bigWin: null | { amount: number; factor: number };
  bonusSummary: null | { total: number };

  // audio
  musicOn: boolean;
  musicReady: boolean;
};

export default class App extends React.Component<{}, AppState> {
  private stageRef = React.createRef<PixiStage>();
  private engine: SlotEngine | null = null;

  state: AppState = {
    spinning: false,
    balance: 1000,
    bet: 10,
    lastWin: 0,
    totalSpinWin: 0,

    showBonusPopup: false,
    freeSpinsLeft: 0,
    bonusTotal: 0,
    bonusSpinsTotal: 10,

    bigWin: null,
    bonusSummary: null,

    musicOn: true,
    musicReady: false,
  };

  // ---- Audio fields ----
  private music: HTMLAudioElement | null = null;
  private boundUnlock = () => {
    this.tryPlayMusic();
    window.removeEventListener("pointerdown", this.boundUnlock);
    window.removeEventListener("keydown", this.boundUnlock);
  };

  async componentDidMount(): Promise<void> {
    const stage = this.stageRef.current;
    if (!stage) return;

    const { grid } = await stage.ready();

    this.engine = new SlotEngine(grid, {
      cols: 6,
      rows: 5,
      bet: this.state.bet,
      basePayTable: {
        apple: 1,
        banana: 1,
        grapes: 2,
        lemon: 2,
        orange: 3,
        peach: 4,
        watermelon: 6,
      },
    });

    // events
    this.engine.on("spinStart", () => {
      this.setState((s) => {
        const inBonus = s.freeSpinsLeft > 0 || !!this.engine?.isInBonus();
        return {
          spinning: true,
          lastWin: 0,
          totalSpinWin: 0,
          // deduct bet only in base game
          balance: inBonus ? s.balance : s.balance - s.bet,
        };
      });
    });

    this.engine.on("tumbleWin", (amount) => {
      this.setState((s) => {
        const inBonus = s.freeSpinsLeft > 0 || this.engine?.isInBonus();
        return {
          lastWin: amount,
          totalSpinWin: inBonus ? s.totalSpinWin : s.totalSpinWin + amount,
          bonusTotal: inBonus ? s.bonusTotal + amount : s.bonusTotal,
        };
      });
    });

    this.engine.on("spinEnd", () => {
      this.setState((s) => {
        const inBonus = s.freeSpinsLeft > 0 || this.engine?.isInBonus();
        return {
          spinning: false,
          balance: inBonus ? s.balance : s.balance + s.totalSpinWin,
          totalSpinWin: 0,
        };
      });
    });

    this.engine.on("bonusTrigger", () => {
      this.setState({ showBonusPopup: true });
    });

    this.engine.on("bonusStart", ({ spins }) => {
      this.setState({
        showBonusPopup: false,
        freeSpinsLeft: spins,
        bonusSpinsTotal: spins,
        bonusTotal: 0,
      });
    });

    this.engine.on("bonusProgress", ({ remaining }) => {
      this.setState({ freeSpinsLeft: remaining });
    });

    this.engine.on("bonusEnd", ({ total }) => {
      this.setState((s) => ({
        freeSpinsLeft: 0,
        bonusTotal: 0,
        balance: s.balance + total,
        showBonusPopup: false,
        bonusSummary: { total },
      }));
    });

    this.engine.on("bigWin", ({ amount, factor }) => {
      this.setState({ bigWin: { amount, factor } });
      const clear = () => {
        window.removeEventListener("mousedown", clear);
        window.removeEventListener("keydown", clear);
        this.setState({ bigWin: null });
      };
      window.addEventListener("mousedown", clear, { once: true });
      window.addEventListener("keydown", clear, { once: true });
      setTimeout(clear, 3000);
    });

    // music + seed
    this.setupMusic();
    this.engine.seed();
    this.tryPlayMusic();
  }

  componentWillUnmount(): void {
    window.removeEventListener("pointerdown", this.boundUnlock);
    window.removeEventListener("keydown", this.boundUnlock);
    try {
      this.music?.pause();
    } catch {}
    this.music = null;
  }

  // ---- Audio helpers ----
  private setupMusic = () => {
    const audio = new Audio("/assets/music/background-music-loop.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.5;
    audio.muted = !this.state.musicOn;
    audio.addEventListener(
      "canplaythrough",
      () => this.setState({ musicReady: true }),
      { once: true }
    );
    this.music = audio;

    window.addEventListener("pointerdown", this.boundUnlock);
    window.addEventListener("keydown", this.boundUnlock);
  };

  private tryPlayMusic = () => {
    if (!this.music) return;
    if (this.state.musicOn && this.music.paused) {
      this.music.play().catch(() => {});
    }
  };

  private toggleMusic = () => {
    const on = !this.state.musicOn;
    this.setState({ musicOn: on }, () => {
      if (!this.music) return;
      this.music.muted = !on;
      if (on) this.tryPlayMusic();
    });
  };

  // ---- Game UI handlers ----
  private handleSpin = () => {
    if (!this.engine || this.state.spinning) return;

    const inBonus = !!this.engine.isInBonus();
    if (!inBonus && this.state.balance < this.state.bet) {
      // optionally show a toast/overlay here
      return;
    }

    if (inBonus) this.engine.spinBonusOnce();
    else this.engine.spin();
  };

  private startBonus = () => {
    this.setState({ showBonusPopup: false }, () => this.engine?.startBonus(6));
  };

  private closeBonusSummary = () => this.setState({ bonusSummary: null });

  render() {
    const {
      spinning,
      balance,
      bet,
      lastWin,
      showBonusPopup,
      freeSpinsLeft,
      bonusSpinsTotal,
      bonusTotal,
      bigWin,
      bonusSummary,
      musicOn,
    } = this.state;

    const inBonus = freeSpinsLeft > 0 || this.engine?.isInBonus();
    const currentIndex = inBonus
      ? Math.max(1, bonusSpinsTotal - freeSpinsLeft + 1)
      : 0;

    return (
      <div style={styles.root}>
        {/* Top row (tools) */}
        <div style={styles.topBarRow}>
          <MusicToggle on={musicOn} onToggle={this.toggleMusic} />
          {/* <LanguageSwitcher /> */}
        </div>

        {/* Center row: grid centered */}
        <div style={styles.centerRow}>
          <div style={styles.stageFrameWrap}>
            {inBonus && (
              <div style={styles.topBarWrap}>
                <TopBar
                  currentIndex={currentIndex}
                  total={bonusSpinsTotal}
                  totalWin={bonusTotal}
                />
              </div>
            )}
            <div style={styles.stageFrame}>
              <PixiStage ref={this.stageRef} />
            </div>
          </div>
        </div>
        <div style={styles.bottomBar}>
          <div style={styles.bottomBarElement}>
            Balance: <b>{fmt(balance)}</b>
          </div>
          <div style={styles.bottomBarElement}>
            Bet: <b>{fmt(bet)}</b>
          </div>
          <div style={styles.bottomBarElement}>
            Win: <b>{fmt(lastWin)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SpinButton
              disabled={spinning}
              label={"SPIN"}
              onClick={this.handleSpin}
            />
          </div>
        </div>

        {bigWin && (
          <BigWinOverlay amount={bigWin.amount} factor={bigWin.factor} />
        )}

        {bonusSummary && (
          <BonusSummaryModal
            total={bonusSummary.total}
            onClose={this.closeBonusSummary}
          />
        )}

        {showBonusPopup && (
          <FeatureModal
            onStart={this.startBonus}
            numberOfSpins={bonusSpinsTotal}
          />
        )}
      </div>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: 800,
    height: 600,
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    display: "grid",
    gridTemplateRows: "48px 1fr 88px",
    gridTemplateColumns: "1fr",
    backgroundImage: 'url("/assets/backgrounds/background.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center top",
    color: "white",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  },

  topBarRow: {
    gridRow: "1 / 2",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
  },

  centerRow: {
    gridRow: "2 / 3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
  },

  stageFrame: {
    width: 560,
    height: 456,
    borderRadius: 12,
    overflow: "hidden",
    background: "transparent",
  },

  bottomBar: {
    gridRow: "3 / 4",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 180px",
    alignItems: "center",
    gap: 12,
    padding: "0 20px",
    backgroundImage: 'url("/assets/backgrounds/fence.png")',
    backgroundSize: "cover",
    backgroundRepeat: "repeat",
    backgroundPosition: "center",
    fontSize: 16,
  },

  bottomBarElement: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 800,
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 50,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(0, 0, 0, 0.36)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
  },
};

const fmt = (n: number) => `${n.toFixed(2)}`;
