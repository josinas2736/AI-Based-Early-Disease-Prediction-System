import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { deleteResult, loadHistory, clearHistory } from '@/services/historyStore';
import type { PredictionResult } from '@/types/types';
import {
  Activity,
  Brain,
  ClipboardList,
  FlaskConical,
  Heart,
  Trash2,
  Zap,
} from 'lucide-react';

const DISEASE_META = {
  diabetes: { icon: Activity, label: 'Diabetes', color: 'text-primary' },
  heart: { icon: Heart, label: 'Heart Disease', color: 'text-[hsl(0,72%,51%)]' },
  pcos: { icon: Zap, label: 'PCOS', color: 'text-[hsl(38,92%,40%)]' },
  stress: { icon: Brain, label: 'Stress / Anxiety', color: 'text-[hsl(199,89%,38%)]' },
};

export default function HistoryPage() {
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [diseaseFilter, setDiseaseFilter] = useState<string>('all');

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function handleDelete(id: string) {
    deleteResult(id);
    setHistory(loadHistory());
  }

  function handleClearAll() {
    clearHistory();
    setHistory([]);
  }

  const filtered = diseaseFilter === 'all'
    ? history
    : history.filter((r) => r.disease === diseaseFilter);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground text-balance">Patient History</h1>
            <p className="text-sm text-muted-foreground">{history.length} prediction session{history.length !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by disease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Diseases</SelectItem>
              <SelectItem value="diabetes">Diabetes</SelectItem>
              <SelectItem value="heart">Heart Disease</SelectItem>
              <SelectItem value="pcos">PCOS</SelectItem>
              <SelectItem value="stress">Stress / Anxiety</SelectItem>
            </SelectContent>
          </Select>

          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Clear all history</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All History?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {history.length} prediction records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <ClipboardList className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">
            {history.length === 0 ? 'No prediction sessions yet' : 'No sessions match this filter'}
          </p>
          {history.length === 0 && (
            <Link to="/">
              <Button variant="outline">Run your first prediction</Button>
            </Link>
          )}
        </div>
      )}

      {/* Session list */}
      <div className="space-y-3">
        {filtered.map((record) => {
          const meta = DISEASE_META[record.disease];
          const Icon = meta.icon;
          const date = new Date(record.timestamp);

          return (
            <Card key={record.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold text-foreground">{meta.label}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RiskBadge level={record.riskLevel} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  {/* Probability bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Risk Score</span>
                      <span className="font-semibold text-foreground">{record.probability}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          record.riskLevel === 'High'
                            ? 'bg-[hsl(var(--risk-high))]'
                            : record.riskLevel === 'Medium'
                            ? 'bg-[hsl(var(--risk-medium))]'
                            : 'bg-[hsl(var(--risk-low))]'
                        }`}
                        style={{ width: `${record.probability}%` }}
                      />
                    </div>
                  </div>

                  {/* Top feature */}
                  <div className="hidden md:block text-xs text-muted-foreground shrink-0">
                    Top factor:{' '}
                    <span className="font-medium text-foreground">
                      {record.features[0]?.label ?? '—'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/results/${record.id}`} state={{ result: record }}>
                      <Button variant="outline" size="sm" className="gap-1.5 h-8">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="sr-only md:not-sr-only">Results</span>
                      </Button>
                    </Link>
                    <Link to={`/xai/${record.id}`} state={{ result: record }}>
                      <Button size="sm" className="gap-1.5 h-8">
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span className="sr-only md:not-sr-only">XAI</span>
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {meta.label} prediction from{' '}
                            {date.toLocaleDateString()}. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(record.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
