import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { loadHistory } from '@/services/historyStore';
import type { PredictionResult } from '@/types/types';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle,
  ClipboardList,
  FlaskConical,
  Heart,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DISEASE_META = {
  diabetes: { icon: Activity, label: 'Diabetes', color: 'text-primary' },
  heart: { icon: Heart, label: 'Heart Disease', color: 'text-[hsl(0,72%,51%)]' },
  pcos: { icon: Zap, label: 'PCOS', color: 'text-[hsl(38,92%,40%)]' },
  stress: { icon: Brain, label: 'Stress / Anxiety', color: 'text-[hsl(199,89%,38%)]' },
};

function ProbabilityGauge({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value < 33
      ? 'hsl(var(--risk-low))'
      : value < 67
      ? 'hsl(var(--risk-medium))'
      : 'hsl(var(--risk-high))';

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg width="144" height="144" className="-rotate-90">
        <circle
          cx="72" cy="72" r={radius}
          stroke="hsl(var(--muted))" strokeWidth="10"
          fill="none"
        />
        <circle
          cx="72" cy="72" r={radius}
          stroke={color} strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{value}%</span>
        <span className="text-xs text-muted-foreground">Risk Score</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictionResult | null>(
    (location.state as { result?: PredictionResult })?.result ?? null
  );

  useEffect(() => {
    if (!result && id) {
      const history = loadHistory();
      const found = history.find((r) => r.id === id);
      if (found) setResult(found);
    }
  }, [id, result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-8">
        <p className="text-muted-foreground">Prediction result not found.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const meta = DISEASE_META[result.disease];
  const Icon = meta.icon;
  const isHigh = result.riskLevel === 'High';
  const isLow = result.riskLevel === 'Low';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Result Hero */}
      <Card className={`border-2 ${isHigh ? 'border-[hsl(var(--risk-high))]' : isLow ? 'border-[hsl(var(--risk-low))]' : 'border-[hsl(var(--risk-medium))]'}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Gauge */}
            <div className="shrink-0">
              <ProbabilityGauge value={result.probability} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Icon className={`w-5 h-5 ${meta.color}`} />
                <span className="text-sm font-medium text-muted-foreground">{meta.label} Assessment</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">
                {result.riskLevel} Risk Detected
              </h2>
              <RiskBadge level={result.riskLevel} className="mb-4" />

              <div className="space-y-2 mt-3">
                {result.interpretation.map((line, i) => (
                  <p key={i} className={`text-sm flex items-start gap-2 ${i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {i === 0 ? (
                      <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    ) : isHigh ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[hsl(var(--risk-high))]" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[hsl(var(--risk-low))]" />
                    )}
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top contributing features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Contributing Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.features.slice(0, 5).map((f) => {
              const isPos = f.contribution > 0;
              const pct = Math.abs(f.contribution) * 100 * 3; // scale for visual
              const barWidth = Math.min(Math.round(pct), 100);
              return (
                <div key={f.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{f.label}</span>
                    <span className={`text-xs font-semibold ${isPos ? 'text-[hsl(var(--risk-high))]' : 'text-[hsl(var(--risk-low))]'}`}>
                      {isPos ? '+' : ''}{(f.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isPos ? 'bg-[hsl(var(--risk-high))]' : 'bg-[hsl(var(--risk-low))]'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Medical disclaimer */}
      {isHigh && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(var(--risk-high-bg))] border border-[hsl(var(--risk-high))/30%]">
          <AlertTriangle className="w-5 h-5 text-[hsl(var(--risk-high))] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--risk-high))]">High Risk — Professional Consultation Recommended</p>
            <p className="text-sm text-muted-foreground mt-1 text-pretty">
              This AI assessment indicates elevated risk. Please consult a qualified healthcare professional for clinical evaluation and diagnosis.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Link to={`/xai/${result.id}`} state={{ result }}>
          <Button size="lg" className="gap-2">
            <FlaskConical className="w-4 h-4" />
            View XAI Dashboard
          </Button>
        </Link>
        <Link to="/history">
          <Button size="lg" variant="outline" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            View History
          </Button>
        </Link>
        <Link to={`/predict/${result.disease}`}>
          <Button size="lg" variant="outline" className="gap-2">
            <Activity className="w-4 h-4" />
            Run Again
          </Button>
        </Link>
      </div>
    </div>
  );
}
