const InfinitySpin = ({ width = "200", color = "#4fa94d" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={Number(width) * 0.5}
    viewBox={`0 0 ${width} ${Number(width) * 0.5}`}
    data-testid="infinity-spin"
  >
    <defs>
      <linearGradient id="gradientColor" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity="1" />
        <stop offset="100%" stopColor={color} stopOpacity="1" />
      </linearGradient>
    </defs>
    <path
      d="M 0,50 C 0,22 22,0 50,0 C 78,0 100,22 100,50 C 100,78 78,100 50,100"
      fill="none"
      stroke={`url(#gradientColor)`}
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray={`${Number(width) * 0.188} ${Number(width) * 0.45}`}
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        dur="2s"
        repeatCount="indefinite"
      />
    </path>
    <path
      d="M 100,50 C 100,78 78,100 50,100 C 22,100 0,78 0,50 C 0,22 22,0 50,0"
      fill="none"
      stroke={`url(#gradientColor)`}
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray={`${Number(width) * 0.188} ${Number(width) * 0.45}`}
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="360 50 50"
        to="0 50 50"
        dur="2s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export default InfinitySpin;
