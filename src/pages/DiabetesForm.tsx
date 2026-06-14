/**
 * Diabetes Prediction Form
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, AlertCircle, Loader2 } from 'lucide-react';
import { predictDiabetes } from '@/services/predictionEngine';
import { saveResult } from '@/services/historyStore';
import type { DiabetesInputs } from '@/types/types';

const INITIAL: DiabetesInputs = {
  age: 0,
  gender: '',
  bmi: 0,
  fastingGlucose: 0,
  hba1c: 0,
  familyHistory: '',
  physicalActivity: '',
  dietaryHabits: '',
};

export default function DiabetesForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<DiabetesInputs>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof DiabetesInputs, string>>>({});
  const [loading, setLoading] = useState(false);

  function setNum(key: keyof DiabetesInputs, v: string) {
    setValues((p) => ({ ...p, [key]: parseFloat(v) || 0 }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function setStr(key: keyof DiabetesInputs, v: string) {
    setValues((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof DiabetesInputs, string>> = {};
    if (!values.age || values.age < 1 || values.age > 120) e.age = 'Age must be 1–120';
    if (!values.gender) e.gender = 'Required';
    if (!values.bmi || values.bmi < 10 || values.bmi > 70) e.bmi = 'BMI must be 10–70';
    if (!values.fastingGlucose || values.fastingGlucose < 50 || values.fastingGlucose > 400)
      e.fastingGlucose = 'Glucose must be 50–400 mg/dL';
    if (!values.hba1c || values.hba1c < 3 || values.hba1c > 15) e.hba1c = 'HbA1c must be 3–15%';
    if (!values.familyHistory) e.familyHistory = 'Required';
    if (!values.physicalActivity) e.physicalActivity = 'Required';
    if (!values.dietaryHabits) e.dietaryHabits = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const result = predictDiabetes(values);
      saveResult(result);
      navigate(`/results/${result.id}`, { state: { result } });
    }, 800);
  }

  const numField = (
    label: string, key: keyof DiabetesInputs, placeholder: string, unit?: string
  ) => (
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
    label: string, key: keyof DiabetesInputs, placeholder: string,
    options: { value: string; label: string }[]
  ) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-normal">{label}</Label>
      <Select value={values[key] as string} onValueChange={(v) => setStr(key, v)}>
        <SelectTrigger className={errors[key] ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
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
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground text-balance">Diabetes Risk Assessment</h1>
          <p className="text-sm text-muted-foreground">Enter clinical parameters to predict diabetes risk</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient Parameters</CardTitle>
            <CardDescription>All fields are required for accurate prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {numField('Age', 'age', 'e.g. 45', 'yrs')}
              {selField('Gender', 'gender', 'Select gender', [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other / Prefer not to say' },
              ])}
              {numField('BMI (Body Mass Index)', 'bmi', 'e.g. 27.5', 'kg/m²')}
              {numField('Fasting Blood Glucose', 'fastingGlucose', 'e.g. 105', 'mg/dL')}
              {numField('HbA1c (Glycated Hemoglobin)', 'hba1c', 'e.g. 6.2', '%')}
              {selField('Family History of Diabetes', 'familyHistory', 'Select option', [
                { value: 'yes', label: 'Yes (direct family member)' },
                { value: 'partial', label: 'Partial (extended family)' },
                { value: 'no', label: 'No family history' },
              ])}
              {selField('Physical Activity Level', 'physicalActivity', 'Select level', [
                { value: 'sedentary', label: 'Sedentary (< 1 hr/week)' },
                { value: 'light', label: 'Light (1–3 hrs/week)' },
                { value: 'moderate', label: 'Moderate (3–5 hrs/week)' },
                { value: 'active', label: 'Active (> 5 hrs/week)' },
              ])}
              {selField('Dietary Habits', 'dietaryHabits', 'Select habits', [
                { value: 'unhealthy', label: 'Unhealthy (high sugar/processed)' },
                { value: 'average', label: 'Average (mixed diet)' },
                { value: 'healthy', label: 'Healthy (balanced nutrition)' },
              ])}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={loading} className="gap-2 min-w-36">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Activity className="w-4 h-4" /> Predict Risk</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
