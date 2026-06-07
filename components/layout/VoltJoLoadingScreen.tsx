export function VoltJoLoadingScreen() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center overflow-hidden bg-white"
    >
      <div className="voltjo-uiverse-loader" aria-hidden="true">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <mask id="voltjo-clipping">
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />
              <polygon points="25,25 75,25 50,75" fill="white" />
              <polygon points="50,25 75,75 25,75" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
            </mask>
            <linearGradient id="voltjo-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="30%" stopColor="var(--color-one)" />
              <stop offset="70%" stopColor="var(--color-two)" />
            </linearGradient>
          </defs>
          <rect
            width="100"
            height="100"
            fill="url(#voltjo-grad)"
            mask="url(#voltjo-clipping)"
          />
        </svg>
      </div>
      <span className="sr-only">جارٍ التحميل</span>
    </section>
  );
}
