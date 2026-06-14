/**
 * XAI Dashboard — SHAP-style Explainable AI visualization
 * Includes: Waterfall plot, Feature Importance bar chart, Contribution analysis
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { loadHistory } from '@/services/historyStore';
import type { FeatureContribution, PredictionResult } from '@/types/types';
import {
  Activity,
  ArrowLeft,
  Brain,
  FlaskConical,
  Heart,
  Info,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

const DISEASE_META = {
  diabetes: { icon: Activity, label: 'Diabetes' },
  heart: { icon: Heart, label: 'Heart Disease' },
  pcos: { icon: Zap, label: 'PCOS' },
  stress: { icon: Brain, label: 'Stress / Anxiety' },
};

// ── Waterfall Chart ──────────────────────────────────────────────────────────

interface WaterfallBar {
  label: string;
  start: number;
  value: number;
  total: number;
  isBase: boolean;
  isFinal: boolean;
}

function buildWaterfallData(features: FeatureContribution[], baseValue: number, probability: number): WaterfallBar[] {
  // Sort by absolute contribution descending, take top 7
  const sorted = [...features].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 7);
  const data: WaterfallBar[] = [];
  let running = baseValue;

  data.push({
    label: 'Base Value',
    start: 0,
    value: baseValue,
    total: baseValue,
    isBase: true,
    isFinal: false,
  });

  for (const f of sorted) {
    const contrib = f.contribution * 100;
    data.push({
      label: f.label,
      start: running,
      value: contrib,
      total: running + contrib,
      isBase: false,
      isFinal: false,
    });
    running += contrib;
  }

  data.push({
    label: 'Final Score',
    start: 0,
    value: probability,
    total: probability,
    isBase: false,
    isFinal: true,
  });

  return data;
}

interface CustomWaterfallBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: WaterfallBar;
}

function CustomWaterfallBar(props: CustomWaterfallBarProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  let fill: string;
  if (payload.isBase || payload.isFinal) {
    fill = 'hsl(var(--primary))';
  } else if (payload.value >= 0) {
    fill = 'hsl(var(--chart-negative))'; // positive contribution → increases risk → red
  } else {
    fill = 'hsl(var(--chart-positive))'; // negative contribution → decreases risk → teal
  }
  return <rect x={x} y={y} width={width} height={Math.abs(height)} fill={fill} rx={3} />;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  payload?: WaterfallBar;
}

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-semibold">{d.label}</p>
      {d.isBase ? (
        <p className="text-muted-foreground">Population base risk: {d.value.toFixed(1)}%</p>
      ) : d.isFinal ? (
        <p className="text-muted-foreground">Final prediction: {d.value.toFixed(1)}%</p>
      ) : (
        <p className={d.value >= 0 ? 'text-[hsl(var(--risk-high))]' : 'text-[hsl(var(--risk-low))]'}>
          {d.value >= 0 ? '+' : ''}{d.value.toFixed(2)}% contribution
        </p>
      )}
    </div>
  );
}

// ── Feature Importance Tooltip ────────────────────────────────────────────────

interface FITooltipPayload {
  value?: number;
  payload?: { label: string };
}

function FITooltip({ active, payload }: { active?: boolean; payload?: FITooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-semibold">{payload[0]?.payload?.label}</p>
      <p className="text-muted-foreground">Importance: {((payload[0]?.value ?? 0) * 100).toFixed(1)}%</p>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function XAIDashboard() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictionResult | null>(
    (location.state as { result?: PredictionResult })?.result ?? null
  );

  useEffect(() => {
    if (!result && id) {
      const found = loadHistory().find((r) => r.id === id);
      if (found) setResult(found);
    }
  }, [id, result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-8">
        <p className="text-muted-foreground">Result not found.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const meta = DISEASE_META[result.disease];
  const Icon = meta.icon;

  // Feature importance data (normalized 0–1)
  const importanceData = [...result.features]
    .sort((a, b) => b.importance - a.importance)
    .map((f) => ({ label: f.label, importance: f.importance }));

  // Waterfall data
  const waterfallData = buildWaterfallData(result.features, result.baseValue, result.probability);

  // Contribution data (signed)
  const contribData = [...result.features]
    .sort((a, b) => b.contribution - a.contribution)
    .map((f) => ({ label: f.label, contribution: parseFloat((f.contribution * 100).toFixed(2)) }));

  const positiveFeatures = result.features.filter((f) => f.contribution > 0).sort((a, b) => b.contribution - a.contribution);
  const negativeFeatures = result.features.filter((f) => f.contribution < 0).sort((a, b) => a.contribution - b.contribution);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground -ml-2 shrink-0 mt-1"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Icon className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-xl font-bold text-foreground text-balance">
              Explainable AI Dashboard — {meta.label}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={result.riskLevel} />
            <span className="text-sm text-muted-foreground">Prediction Score: {result.probability}%</span>
          </div>
        </div>
      </div>

      {/* XAI info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary border border-border">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground text-pretty">
          <span className="font-semibold text-foreground">SHAP-based Explainability: </span>
          The charts below show how each clinical feature contributed to the final prediction.
          <span className="text-[hsl(var(--risk-high))]"> Red bars</span> indicate features that increase risk;
          <span className="text-[hsl(var(--risk-low))]"> teal bars</span> indicate features that decrease risk.
          Base value represents the population average risk.
        </p>
      </div>

      {/* Grid: Waterfall + Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SHAP Waterfall Plot */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              SHAP Waterfall Plot
            </CardTitle>
            <CardDescription>How each feature shifts the prediction from the base value</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="w-full min-w-0 overflow-hidden" style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={waterfallData}
                  layout="vertical"
                  margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={95}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<WaterfallTooltip />} />
                  <Bar
                    dataKey="total"
                    shape={(props: CustomWaterfallBarProps) => <CustomWaterfallBar {...props} />}
                    radius={[0, 3, 3, 0]}
                  >
                    {waterfallData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isBase || entry.isFinal
                            ? 'hsl(var(--primary))'
                            : entry.value >= 0
                            ? 'hsl(var(--chart-negative))'
                            : 'hsl(var(--chart-positive))'
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="total"
                      position="right"
                      formatter={(v: number) => `${v.toFixed(1)}%`}
                      style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Feature Importance Ranking
            </CardTitle>
            <CardDescription>Normalized importance scores for all input features</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="w-full min-w-0 overflow-hidden" style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={importanceData}
                  layout="vertical"
                  margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={95}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<FITooltip />} />
                  <Bar dataKey="importance" radius={[0, 3, 3, 0]} fill="hsl(var(--primary))">
                    <LabelList
                      dataKey="importance"
                      position="right"
                      formatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                      style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signed Contribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Signed Feature Contributions (LIME-style)
          </CardTitle>
          <CardDescription>
            Positive values push prediction toward higher risk; negative values reduce risk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 overflow-hidden" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={contribData}
                layout="vertical"
                margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={105}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Contribution']}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar dataKey="contribution" radius={[0, 3, 3, 0]}>
                  {contribData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.contribution >= 0
                          ? 'hsl(var(--chart-negative))'
                          : 'hsl(var(--chart-positive))'
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="contribution"
                    position="right"
                    formatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                    style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk-increasing factors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--risk-high))]" />
              Risk-Increasing Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {positiveFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No significant risk factors detected.</p>
            ) : (
              <div className="space-y-2">
                {positiveFeatures.map((f) => (
                  <div key={f.feature} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground truncate">{f.label}</span>
                    <span className="text-xs font-semibold text-[hsl(var(--risk-high))] shrink-0">
                      +{(f.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk-decreasing factors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[hsl(var(--risk-low))]" />
              Risk-Reducing Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {negativeFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No significant risk-reducing factors found.</p>
            ) : (
              <div className="space-y-2">
                {negativeFeatures.map((f) => (
                  <div key={f.feature} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground truncate">{f.label}</span>
                    <span className="text-xs font-semibold text-[hsl(var(--risk-low))] shrink-0">
                      {(f.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model metadata */}
      <Card className="bg-muted/40">
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Model Type', value: 'Logistic Regression' },
              { label: 'XAI Method', value: 'SHAP Values' },
              { label: 'Features Used', value: `${result.features.length}` },
              { label: 'Base Rate', value: `${result.baseValue}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
