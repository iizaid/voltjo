export function TechnicalBackground() {
  const panels = [
    "tech-bg-panel-a",
    "tech-bg-panel-b",
    "tech-bg-panel-c",
    "tech-bg-panel-d",
    "tech-bg-panel-e",
  ];

  const dotClusters = [
    "tech-bg-dots-a",
    "tech-bg-dots-b",
    "tech-bg-dots-c",
    "tech-bg-dots-d",
  ];

  const circuits = [
    "tech-bg-circuit-a",
    "tech-bg-circuit-b",
    "tech-bg-circuit-c",
    "tech-bg-circuit-d",
  ];

  const markers = [
    "tech-bg-marker-a",
    "tech-bg-marker-b",
    "tech-bg-marker-c",
    "tech-bg-marker-d",
    "tech-bg-marker-e",
  ];

  return (
    <div aria-hidden="true" className="page-bg">
      <div className="tech-grid" />
      <div className="tech-glow tech-glow-a" />
      <div className="tech-glow tech-glow-b" />

      {panels.map((panel) => (
        <div key={panel} className={`tech-bg-panel ${panel}`} />
      ))}

      {dotClusters.map((cluster) => (
        <div key={cluster} className={`tech-bg-dots ${cluster}`} />
      ))}

      {circuits.map((circuit) => (
        <div key={circuit} className={`tech-bg-circuit ${circuit}`}>
          <span />
        </div>
      ))}

      {markers.map((marker) => (
        <div key={marker} className={`tech-bg-marker ${marker}`} />
      ))}
    </div>
  );
}
