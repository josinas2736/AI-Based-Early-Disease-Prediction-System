/**
 * PCOS Prediction Form
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Zap } from 'lucide-react';
import { predictPCOS } from '@/services/predictionEngine';
import { saveResult } from '@/services/historyStore';
import type { PCOSInputs } from '@/types/types';

const INITIAL: PCOSInputs = {
  age: 0,
  bmi: 0,
  menstrualRegularity: '',
  hirsutism: '',
  acneSeverity: '',
  weightGainPattern: '',
  familyHistory: '',
  insulinResistance: '',
};

export default function PCOSForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<PCOSInputs>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof PCOSInputs, string>>>({});
  const [loading, setLoading] = useState(false);

  function setNum(key: keyof PCOSInputs, v: string) {
    setValues((p) => ({ ...p, [key]: parseFloat(v) || 0 }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function setStr(key: keyof PCOSInputs, v: string) {
    setValues((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof PCOSInputs, string>> = {};
    if (!values.age || values.age < 10 || values.age > 60) e.age = 'Age must be 10–60';
    if (!values.bmi || values.bmi < 10 || values.bmi > 70) e.bmi = 'BMI must be 10–70';
    if (!values.menstrualRegularity) e.menstrualRegularity = 'Required';
    if (!values.hirsutism) e.hirsutism = 'Required';
    if (!values.acneSeverity) e.acneSeverity = 'Required';
    if (!values.weightGainPattern) e.weightGainPattern = 'Required';
    if (!values.familyHistory) e.familyHistory = 'Required';
    if (!values.insulinResistance) e.insulinResistance = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const result = predictPCOS(values);
      saveResult(result);
      navigate(`/results/${result.id}`, { state: { result } });
    }, 800);
  }

  const numField = (label: string, key: keyof PCOSInputs, placeholder: string, unit?: string) => (
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
    key: keyof PCOSInputs,
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
        <div className="w-10 h-10 rounded-xl bg-[hsl(38,92%,95%)] dark:bg-[hsl(38,60%,14%)] flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-[hsl(38,92%,40%)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground text-balance">PCOS Risk Assessment</h1>
          <p className="text-sm text-muted-foreground">Hormonal & metabolic indicator analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hormonal & Metabolic Parameters</CardTitle>
            <CardDescription>All fields are required for accurate prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {numField('Age', 'age', 'e.g. 26', 'yrs')}
              {numField('BMI (Body Mass Index)', 'bmi', 'e.g. 28.4', 'kg/m²')}
              {selField('Menstrual Cycle Regularity', 'menstrualRegularity', 'Select regularity', [
                { value: 'regular', label: 'Regular (28–35 day cycle)' },
                { value: 'irregular', label: 'Irregular (missed or delayed cycles)' },
                { value: 'very_irregular', label: 'Very irregular / absent cycles' },
              ])}
              {selField('Insulin Resistance Indicators', 'insulinResistance', 'Select level', [
                { value: 'low', label: 'Low (normal blood sugar control)' },
                { value: 'moderate', label: 'Moderate (occasional spikes)' },
                { value: 'high', label: 'High (frequent spikes / pre-diabetic markers)' },
              ])}
              {selField('Hirsutism (Excess Hair Growth)', 'hirsutism', 'Select severity', [
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild (slight facial / body hair)' },
                { value: 'moderate', label: 'Moderate (noticeable excess hair)' },
                { value: 'severe', label: 'Severe (significant growth on face/body)' },
              ])}
              {selField('Acne Severity', 'acneSeverity', 'Select severity', [
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild (occasional breakouts)' },
                { value: 'moderate', label: 'Moderate (regular breakouts)' },
                { value: 'severe', label: 'Severe (persistent cystic acne)' },
              ])}
              {selField('Weight Gain Pattern', 'weightGainPattern', 'Select pattern', [
                { value: 'stable', label: 'Stable (no significant change)' },
                { value: 'gradual', label: 'Gradual gain over time' },
                { value: 'rapid_central', label: 'Rapid / central (abdominal) weight gain' },
              ])}
              {selField('Family History of PCOS', 'familyHistory', 'Select option', [
                { value: 'yes', label: 'Yes (mother, sister, aunt)' },
                { value: 'partial', label: 'Partial (suspected but undiagnosed)' },
                { value: 'no', label: 'No known family history' },
              ])}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={loading} className="gap-2 min-w-36">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Predict Risk</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
