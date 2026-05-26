const InfinitySpin = ({ width = "200", color = "#4fa94d" }) => {
  const w = Number(width);
  const h = Math.max(w * 0.5, 40);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w * 0.17, 35);
  const gap = 6;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#ig)" strokeWidth="5" strokeLinecap="round">
        <path
          d={`M ${cx},${cy} A ${r},${r} 0 1,1 ${cx - r * 2 - gap},${cy}`}
          strokeDasharray={`${r * 1.8} ${r * 5}`}
        >
          <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="2s" repeatCount="indefinite" />
        </path>
        <path
          d={`M ${cx},${cy} A ${r},${r} 0 1,0 ${cx + r * 2 + gap},${cy}`}
          strokeDasharray={`${r * 1.8} ${r * 5}`}
        >
          <animateTransform attributeName="transform" type="rotate" from={`360 ${cx} ${cy}`} to={`0 ${cx} ${cy}`} dur="2s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
};

export default InfinitySpin;
