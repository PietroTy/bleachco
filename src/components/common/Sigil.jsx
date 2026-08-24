function Sigil() {
  return (
    <svg viewBox="0 0 120 120" className="hero-sigil" fill="none">
      <circle cx="60" cy="60" r="55" stroke="rgba(201,168,76,0.3)"   strokeWidth="0.5"/>
      <circle cx="60" cy="60" r="45" stroke="rgba(139,90,200,0.3)"   strokeWidth="0.5"/>
      <circle cx="60" cy="60" r="35" stroke="rgba(201,168,76,0.2)"   strokeWidth="0.5"/>

      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <circle
            key={`dot-${i}`}
            cx={60 + 45 * Math.cos(rad)}
            cy={60 + 45 * Math.sin(rad)}
            r="3"
            fill="rgba(201,168,76,0.5)"
          />
        );
      })}

      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad  = (deg * Math.PI) / 180;
        const rad2 = ((deg + 120) * Math.PI) / 180;
        return (
          <line
            key={`line-${i}`}
            x1={60 + 45 * Math.cos(rad)}
            y1={60 + 45 * Math.sin(rad)}
            x2={60 + 45 * Math.cos(rad2)}
            y2={60 + 45 * Math.sin(rad2)}
            stroke="rgba(139,90,200,0.25)"
            strokeWidth="0.5"
          />
        );
      })}

      <polygon
        points="60,20 69.4,47.1 98,47.6 75.2,64.9 83.5,92.4 60,76 36.5,92.4 44.8,64.9 22,47.6 50.6,47.1"
        fill="none"
        stroke="rgba(201,168,76,0.4)"
        strokeWidth="0.5"
      />
      <circle cx="60" cy="60" r="6" fill="rgba(201,168,76,0.6)" />
      <circle cx="60" cy="60" r="3" fill="rgba(201,168,76,0.9)" />
    </svg>
  );
}

export default Sigil;
