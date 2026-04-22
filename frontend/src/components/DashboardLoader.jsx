import { useEffect, useState, memo } from "react";
import { BarChart3, MessageSquare, Zap } from "lucide-react";
import "../styles/InsightsLoader.css";

const STEPS = [
  "Connecting to feedback pipeline...",
  "Aggregating team signals...",
  "Running sentiment analysis...",
  "Clustering issue patterns...",
  "Scoring product health...",
  "Generating decision intelligence...",
];

const DashboardLoader = memo(() => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="il-wrap">
      <div className="il-glow-tl" />
      <div className="il-glow-br" />

      <div className="il-hud">
        {/* Outer ring */}
        <div className="il-ring il-ring-outer">
          {[0,45,90,135,180,225,270,315].map((deg) => (
            <div key={deg} className="il-tick" style={{ transform: `rotate(${deg}deg) translateX(138px)` }} />
          ))}
        </div>

        {/* Mid ring */}
        <div className="il-ring il-ring-mid">
          {[0,60,120,180,240,300].map((deg) => (
            <div key={deg} className="il-tick" style={{ transform: `rotate(${deg}deg) translateX(108px)`, width: 9 }} />
          ))}
        </div>

        {/* Inner ring */}
        <div className="il-ring il-ring-inner" />

        {/* Scanning arc */}
        <div className="il-ring il-ring-scan" />

        {/* Data nodes */}
        {[
          { deg: 30,  cls: "il-node-0" },
          { deg: 120, cls: "il-node-1" },
          { deg: 210, cls: "il-node-2" },
          { deg: 300, cls: "il-node-3" },
        ].map(({ deg, cls }) => {
          const rad = (deg * Math.PI) / 180;
          const r = 138;
          return (
            <div
              key={deg}
              className={`il-node ${cls}`}
              style={{
                transform: `translate(calc(-50% + ${Math.cos(rad) * r}px), calc(-50% + ${Math.sin(rad) * r}px))`,
              }}
            />
          );
        })}

        {/* Center core */}
        <div className="il-core">
          <div className="il-core-glow" />
          <div className="il-core-ring">
            <span className="il-core-label">PP</span>
          </div>
        </div>

        {/* Corner crosshairs */}
        <div className="il-cross il-cross-tl" />
        <div className="il-cross il-cross-tr" />
        <div className="il-cross il-cross-bl" />
        <div className="il-cross il-cross-br" />
      </div>

      {/* Mini metric cards */}
      <div className="il-cards">
        {[
          { icon: <BarChart3 size={14} />, label: "Health" },
          { icon: <MessageSquare size={14} />, label: "Signals" },
          { icon: <Zap size={14} />, label: "Insights" },
        ].map(({ icon, label }) => (
          <div key={label} className="il-card">
            <div className="il-card-icon">{icon}</div>
            <div className="il-card-bar"><div className="il-card-bar-fill" /></div>
            <div className="il-card-text">{label}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="il-status">
        <div className="il-eyebrow">PROD PILOT &mdash; LOADING DASHBOARD</div>
        <div className="il-step-text">{STEPS[step]}</div>
        <div className="il-pills">
          {STEPS.map((_, i) => (
            <div key={i} className={`il-pill ${i === step ? "il-pill-active" : "il-pill-inactive"}`} />
          ))}
        </div>
      </div>
    </div>
  );
});

DashboardLoader.displayName = "DashboardLoader";
export default DashboardLoader;
