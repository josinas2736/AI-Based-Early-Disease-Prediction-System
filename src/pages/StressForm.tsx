/**
 * Stress / Anxiety Prediction Form
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Brain, Loader2 } from 'lucide-react';
import { predictStress } from '@/services/predictionEngine';
import { saveResult } from '@/services/historyStore';
import type { StressInputs } from '@/types/types';

const INITIAL: StressInputs = {
  age: 0,
  gender: '',
  sleepQuality: '',
  workHoursPerWeek: 0,
  socialSupport: '',
  physicalSymptoms: '',
  moodPatterns: '',
  copingMechanisms: '',
};

export default function StressForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<StressInputs>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof StressInputs, string>>>({});
  const [loading, setLoading] = useState(false);

  function setNum(key: keyof StressInputs, v: string) {
    setValues((p) => ({ ...p, [key]: parseFloat(v) || 0 }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function setStr(key: keyof StressInputs, v: string) {
    setValues((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof StressInputs, string>> = {};
    if (!values.age || values.age < 1 || values.age > 120) e.age = 'Age must be 1–120';
    if (!values.gender) e.gender = 'Required';
    if (!values.sleepQuality) e.sleepQuality = 'Required';
    if (!values.workHoursPerWeek || values.workHoursPerWeek < 0 || values.workHoursPerWeek > 120)
      e.workHoursPerWeek = 'Must be 0–120 hours';
    if (!values.socialSupport) e.socialSupport = 'Required';
    if (!values.physicalSymptoms) e.physicalSymptoms = 'Required';
    if (!values.moodPatterns) e.moodPatterns = 'Required';
    if (!values.copingMechanisms) e.copingMechanisms = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const result = predictStress(values);
      saveResult(result);
      navigate(`/results/${result.id}`, { state: { result } });
    }, 800);
  }

  const numField = (label: string, key: keyof StressInputs, placeholder: string, unit?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key} className="text-sm font-normal">{label}</Label>
      <div className="relative">
        <Input
          id={key}
          type="number"
          placeholder={placeholder}
          value={(values[key] as number) || ''}
          onChange={(e) => setNum(key, e.target.value)}
          className={errors[key] ? 'border-destructive' : ''}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {errors[key] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[key]}
        </p>
      )}
    </div>
  );

  const selField = (
    label: string,
    key: keyof StressInputs,
    placeholder: string,
    options: { value: string; label: string }[]
  ) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-normal">{label}</Label>
      <Select value={values[key] as string} onValueChange={(v) => setStr(key, v)}>
        <SelectTrigger className={errors[key] ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {errors[key] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(199,89%,94%)] dark:bg-[hsl(199,60%,14%)] flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-[hsl(199,89%,38%)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground text-balance">Stress / Anxiety Risk Assessment</h1>
          <p className="text-sm text-muted-foreground">Psychological & lifestyle stress indicator analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Psychological & Lifestyle Parameters</CardTitle>
            <CardDescription>All fields are required for accurate prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {numField('Age', 'age', 'e.g. 32', 'yrs')}
              {selField('Gender', 'gender', 'Select gender', [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'non_binary', label: 'Non-binary / Other' },
              ])}
              {selField('Sleep Quality', 'sleepQuality', 'Select quality', [
                { value: 'very_poor', label: 'Very Poor (< 4 hrs or severe insomnia)' },
                { value: 'poor', label: 'Poor (4–5 hrs, frequent waking)' },
                { value: 'fair', label: 'Fair (5–6 hrs, occasional issues)' },
                { value: 'good', label: 'Good (6–8 hrs, mostly restful)' },
                { value: 'excellent', label: 'Excellent (7–9 hrs, fully rested)' },
              ])}
              {numField('Work Hours Per Week', 'workHoursPerWeek', 'e.g. 48', 'hrs')}
              {selField('Social Support Level', 'socialSupport', 'Select level', [
                { value: 'none', label: 'None (isolated, no support network)' },
                { value: 'low', label: 'Low (few connections, minimal support)' },
                { value: 'moderate', label: 'Moderate (some friends/family support)' },
                { value: 'strong', label: 'Strong (reliable support network)' },
              ])}
              {selField('Physical Symptoms (Headaches, Fatigue)', 'physicalSymptoms', 'Select severity', [
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild (occasional headaches/fatigue)' },
                { value: 'moderate', label: 'Moderate (frequent, affecting daily life)' },
                { value: 'severe', label: 'Severe (chronic, debilitating symptoms)' },
              ])}
              {selField('Mood Patterns', 'moodPatterns', 'Select pattern', [
                { value: 'calm_positive', label: 'Calm & positive (mostly stable)' },
                { value: 'neutral', label: 'Neutral (moderate emotional range)' },
                { value: 'sometimes_anxious', label: 'Sometimes anxious / irritable' },
                { value: 'frequently_anxious', label: 'Frequently anxious / overwhelmed' },
              ])}
              {selField('Coping Mechanisms', 'copingMechanisms', 'Select type', [
                { value: 'healthy', label: 'Healthy (exercise, meditation, therapy)' },
                { value: 'moderate', label: 'Moderate (hobbies, social activities)' },
                { value: 'limited', label: 'Limited (mostly passive, avoidance)' },
                { value: 'unhealthy', label: 'Unhealthy (substance use, over-eating)' },
              ])}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={loading} className="gap-2 min-w-36">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Predict Risk</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
