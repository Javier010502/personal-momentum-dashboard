import { useEffect, useRef, useState } from 'react';

// Custom SVG momentum gauge: an open half-ring arc (not a repurposed
// doughnut). The thick accent arc sweeps from empty to the score on mount, and
// re-animates whenever the score changes. Honors prefers-reduced-motion.
//
// viewBox 320x200. Arc path: M20 180 A140 140 0 0 1 300 180 (a 140px-radius
// semicircle over the top). Approximate length = PI * 140 ~= 440.

const ARC_LEN = 440;

export default function Gauge({ score, financialHealth, habitConsistency, reduced }) {
  const [shown, setShown] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduced) {
      setShown(score);
      return;
    }
    // animate from current shown value to target
    const from = shown;
    const to = score;
    const dur = 1100;
    const start = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, reduced]);

  const offset = ARC_LEN * (1 - shown / 100);

  return (
    <div className="gauge" role="img" aria-label={`Momentum score ${score} out of 100`}>
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
        <path
          d="M20 180 A140 140 0 0 1 300 180"
          fill="none"
          stroke="var(--line)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          className="gauge-arc"
          d="M20 180 A140 140 0 0 1 300 180"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center">
        <div className="gauge-num">{shown}</div>
        <div className="gauge-label">momentum</div>
      </div>
      <div className="gauge-axes">
        <div className="gauge-axis">
          <span className="gauge-axis-v">{financialHealth}</span>
          <span className="gauge-axis-k">finance</span>
        </div>
        <div className="gauge-axis">
          <span className="gauge-axis-v">{habitConsistency}</span>
          <span className="gauge-axis-k">habits</span>
        </div>
      </div>
    </div>
  );
}
