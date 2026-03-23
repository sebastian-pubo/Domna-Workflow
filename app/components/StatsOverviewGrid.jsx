'use client';

export default function StatsOverviewGrid({
  metricCards,
  metricLabels,
  defaultMetrics,
  setMetricLabels,
}) {
  return (
    <div className="statsGrid">
      {metricCards.map((card) => (
        <div className="statCard" key={card.key}>
          <input
            className="statLabelInput"
            value={metricLabels[card.key] || defaultMetrics[card.key]}
            onChange={(event) => setMetricLabels((prev) => ({ ...prev, [card.key]: event.target.value }))}
          />
          <div className="statValue">{card.value}</div>
          <div className="statSub">{card.description}</div>
        </div>
      ))}
    </div>
  );
}
