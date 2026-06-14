import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { loadHistory } from '@/services/historyStore';
import type { PredictionResult } from '@/types/types';
import {
  Activity,
  Brain,
  ClipboardList,
  GitCompare,
  Heart,
  Zap,
} from 'lucide-react';

const DISEASE_META = {
  diabetes: { icon: Activity, label: 'Diabetes', color: '#0A7E8C' },
  heart: { icon: Heart, label: 'Heart Disease', color: '#C53030' },
  pcos: { icon: Zap, label: 'PCOS', color: '#D97706' },
  stress: { icon: Brain, label: 'Stress / Anxiety', color: '#0369A1' },
};

const DISEASE_COLORS = ['#0A7E8C', '#C53030', '#D97706', '#0369A1', '#7C3AED', '#059669'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ComparePage() {
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    // Auto-select first 4
    const initial = new Set(h.slice(0, 4).map((r) => r.id));
    setSelected(initial);
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 6) {
        next.add(id);
      }
      return next;
    });
  }

  const chosenRecords = history.filter((r) => selected.has(r.id));

  // ── Trend: risk score by disease over time ─────────────────────────────────
  const trendByDisease: Record<string, { date: string; score: number }[]> = {};
  for (const r of history) {
    if (!trendByDisease[r.disease]) trendByDisease[r.disease] = [];
    trendByDisease[r.disease].push({
      date: formatDate(r.timestamp),
      score: r.probability,
    });
  }

  // ── Radar: average feature importance across selected records ──────────────
  const allFeatureLabels = Array.from(
    new Set(chosenRecords.flatMap((r) => r.features.map((f) => f.label)))
  ).slice(0, 8);

  const radarData = allFeatureLabels.map((label) => {
    const entry: Record<string, number | string> = { label };
    for (const r of chosenRecords) {
      const f = r.features.find((x) => x.label === label);
      entry[r.id.slice(-5)] = f ? Math.round(f.importance * 100) : 0;
    }
    return entry;
  });

  // ── Side-by-side comparison table ─────────────────────────────────────────
  const comparisonRows = [
    { key: 'disease', label: 'Condition', render: (r: PredictionResult) => DISEASE_META[r.disease].label },
    { key: 'probability', label: 'Risk Score', render: (r: PredictionResult) => `${r.probability}%` },
    { key: 'riskLevel', label: 'Risk Level', render: (r: PredictionResult) => <RiskBadge level={r.riskLevel} showIcon={false} /> },
    { key: 'topFactor', label: 'Top Factor', render: (r: PredictionResult) => r.features[0]?.label ?? '—' },
    { key: 'date', label: 'Date', render: (r: PredictionResult) => formatDate(r.timestamp) },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <GitCompare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground text-balance">Comparative Analysis</h1>
          <p className="text-sm text-muted-foreground">Compare risk scores across sessions and disease types</p>
        </div>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <GitCompare className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No prediction history available for comparison</p>
          <Link to="/">
            <Button variant="outline">Run your first prediction</Button>
          </Link>
        </div>
      )}

      {history.length > 0 && (
        <>
          {/* Session selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Sessions to Compare</CardTitle>
              <CardDescription>Choose up to 6 sessions (currently {selected.size} selected)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {history.map((r) => {
                  const meta = DISEASE_META[r.disease];
                  const Icon = meta.icon;
                  const isChecked = selected.has(r.id);
                  const isDisabled = !isChecked && selected.size >= 6;

                  return (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors min-h-12 ${
                        isChecked ? 'border-primary bg-secondary' : 'border-border hover:bg-muted'
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => !isDisabled && toggleSelect(r.id)}
                        disabled={isDisabled}
                        id={r.id}
                      />
                      <Icon className={`w-4 h-4 shrink-0 ${meta.color ? '' : 'text-muted-foreground'}`} style={{ color: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={r.id} className="text-xs font-medium cursor-pointer text-foreground">
                          {meta.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{formatDate(r.timestamp)}</p>
                      </div>
                      <RiskBadge level={r.riskLevel} showIcon={false} className="text-xs" />
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Insufficient data */}
          {chosenRecords.length < 2 && (
            <div className="flex items-center justify-center py-12 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">Select at least 2 sessions to view comparison charts</p>
            </div>
          )}

          {/* Charts */}
          {chosenRecords.length >= 2 && (
            <>
              {/* Side-by-side comparison table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-primary" />
                    Session Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto w-full max-w-full">
                    <table className="w-full min-w-max text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-normal whitespace-nowrap">Metric</th>
                          {chosenRecords.map((r, i) => (
                            <th key={r.id} className="text-center py-2 px-3 font-medium text-foreground whitespace-nowrap">
                              Session {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map(({ key, label, render }) => (
                          <tr key={key} className="border-b border-border last:border-0">
                            <td className="py-2.5 pr-4 text-muted-foreground font-normal whitespace-nowrap">{label}</td>
                            {chosenRecords.map((r) => (
                              <td key={r.id} className="py-2.5 px-3 text-center whitespace-nowrap">
                                {render(r)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Score Bar comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Score Comparison</CardTitle>
                  <CardDescription>Predicted risk scores across selected sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chosenRecords.map((r, i) => {
                      const meta = DISEASE_META[r.disease];
                      return (
                        <div key={r.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">
                              Session {i + 1} — {meta.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <RiskBadge level={r.riskLevel} showIcon={false} />
                              <span className="font-bold text-foreground">{r.probability}%</span>
                            </div>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${r.probability}%`, backgroundColor: DISEASE_COLORS[i] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Radar chart — feature importance across sessions */}
              {radarData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Feature Importance Radar</CardTitle>
                    <CardDescription>Comparison of key feature importance scores across selected sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full min-w-0 overflow-hidden" style={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          {chosenRecords.map((r, i) => (
                            <Radar
                              key={r.id}
                              name={`Session ${i + 1}`}
                              dataKey={r.id.slice(-5)}
                              stroke={DISEASE_COLORS[i]}
                              fill={DISEASE_COLORS[i]}
                              fillOpacity={0.15}
                            />
                          ))}
                          <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--popover-foreground))',
                              fontSize: 12,
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Trend chart: disease risk over time */}
          {Object.keys(trendByDisease).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Risk Score Trends Over Time
                </CardTitle>
                <CardDescription>Historical risk trajectories per disease (all sessions)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(trendByDisease).map(([disease, points], idx) => {
                    const meta = DISEASE_META[disease as keyof typeof DISEASE_META];
                    const color = DISEASE_COLORS[idx % DISEASE_COLORS.length];
                    return (
                      <div key={disease}>
                        <div className="flex items-center gap-2 mb-2">
                          <meta.icon className="w-4 h-4 shrink-0" style={{ color }} />
                          <p className="text-sm font-medium text-foreground">{meta.label}</p>
                          <span className="text-xs text-muted-foreground">({points.length} session{points.length !== 1 ? 's' : ''})</span>
                        </div>
                        {points.length < 2 ? (
                          <div className="flex items-center justify-center h-24 bg-muted/40 rounded-lg">
                            <p className="text-xs text-muted-foreground">Need 2+ sessions for trend</p>
                          </div>
                        ) : (
                          <div className="w-full min-w-0 overflow-hidden" style={{ height: 160 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[0, 100]}
                                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                  tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip
                                  formatter={(v: number) => [`${v}%`, 'Risk Score']}
                                  contentStyle={{
                                    background: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    color: 'hsl(var(--popover-foreground))',
                                    fontSize: 11,
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="score"
                                  stroke={color}
                                  strokeWidth={2}
                                  dot={{ r: 4, fill: color }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* CTA to history */}
      {history.length > 0 && (
        <div className="flex justify-center">
          <Link to="/history">
            <Button variant="outline" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Manage All Sessions
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
