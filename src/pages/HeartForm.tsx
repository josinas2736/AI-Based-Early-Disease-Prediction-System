/**
 * Heart Disease Prediction Form
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Heart, Loader2 } from 'lucide-react';
import { predictHeart } from '@/services/predictionEngine';
import { saveResult } from '@/services/historyStore';
import type { HeartInputs } from '@/types/types';

const INITIAL: HeartInputs = {
  age: 0,
  gender: '',
  systolicBP: 0,
  diastolicBP: 0,
  totalCholesterol: 0,
  ldlCholesterol: 0,
  hdlCholesterol: 0,
  smokingStatus: '',
  familyHistory: '',
  exerciseFrequency: '',
  chestPainType: '',
};

export default function HeartForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<HeartInputs>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof HeartInputs, string>>>({});
  const [loading, setLoading] = useState(false);

  function setNum(key: keyof HeartInputs, v: string) {
    setValues((p) => ({ ...p, [key]: parseFloat(v) || 0 }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function setStr(key: keyof HeartInputs, v: string) {
    setValues((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof HeartInputs, string>> = {};
    if (!values.age || values.age < 1 || values.age > 120) e.age = 'Age must be 1–120';
    if (!values.gender) e.gender = 'Required';
    if (!values.systolicBP || values.systolicBP < 70 || values.systolicBP > 250) e.systolicBP = 'Must be 70–250 mmHg';
    if (!values.diastolicBP || values.diastolicBP < 40 || values.diastolicBP > 150) e.diastolicBP = 'Must be 40–150 mmHg';
    if (!values.totalCholesterol || values.totalCholesterol < 100 || values.totalCholesterol > 600) e.totalCholesterol = 'Must be 100–600 mg/dL';
    if (!values.ldlCholesterol || values.ldlCholesterol < 50 || values.ldlCholesterol > 400) e.ldlCholesterol = 'Must be 50–400 mg/dL';
    if (!values.hdlCholesterol || values.hdlCholesterol < 20 || values.hdlCholesterol > 150) e.hdlCholesterol = 'Must be 20–150 mg/dL';
    if (!values.smokingStatus) e.smokingStatus = 'Required';
    if (!values.familyHistory) e.familyHistory = 'Required';
    if (!values.exerciseFrequency) e.exerciseFrequency = 'Required';
    if (!values.chestPainType) e.chestPainType = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const result = predictHeart(values);
      saveResult(result);
      navigate(`/results/${result.id}`, { state: { result } });
    }, 800);
  }

  const numField = (label: string, key: keyof HeartInputs, placeholder: string, unit?: string) => (
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
    label: string, key: keyof HeartInputs, placeholder: string,
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
        <div className="w-10 h-10 rounded-xl bg-[hsl(0,72%,96%)] dark:bg-[hsl(0,60%,14%)] flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-[hsl(0,72%,51%)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground text-balance">Heart Disease Risk Assessment</h1>
          <p className="text-sm text-muted-foreground">Enter cardiovascular parameters for risk prediction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cardiovascular Parameters</CardTitle>
            <CardDescription>All fields are required for accurate prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {numField('Age', 'age', 'e.g. 52', 'yrs')}
              {selField('Gender', 'gender', 'Select gender', [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ])}
              {numField('Systolic Blood Pressure', 'systolicBP', 'e.g. 130', 'mmHg')}
              {numField('Diastolic Blood Pressure', 'diastolicBP', 'e.g. 85', 'mmHg')}
              {numField('Total Cholesterol', 'totalCholesterol', 'e.g. 220', 'mg/dL')}
              {numField('LDL Cholesterol', 'ldlCholesterol', 'e.g. 140', 'mg/dL')}
              {numField('HDL Cholesterol', 'hdlCholesterol', 'e.g. 45', 'mg/dL')}
              {selField('Smoking Status', 'smokingStatus', 'Select status', [
                { value: 'never', label: 'Never smoked' },
                { value: 'former', label: 'Former smoker' },
                { value: 'current', label: 'Current smoker' },
              ])}
              {selField('Family History of Heart Disease', 'familyHistory', 'Select option', [
                { value: 'yes', label: 'Yes (direct family member)' },
                { value: 'partial', label: 'Partial (extended family)' },
                { value: 'no', label: 'No family history' },
              ])}
              {selField('Exercise Frequency', 'exerciseFrequency', 'Select frequency', [
                { value: 'never', label: 'Never' },
                { value: 'rarely', label: 'Rarely (< 1x/week)' },
                { value: 'sometimes', label: 'Sometimes (1–2x/week)' },
                { value: 'regular', label: 'Regular (3+ times/week)' },
              ])}
              <div className="md:col-span-2">
                {selField('Chest Pain Type', 'chestPainType', 'Select type', [
                  { value: 'none', label: 'None / Asymptomatic' },
                  { value: 'non_anginal', label: 'Non-anginal pain' },
                  { value: 'atypical_angina', label: 'Atypical angina' },
                  { value: 'typical_angina', label: 'Typical angina' },
                ])}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={loading} className="gap-2 min-w-36">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Heart className="w-4 h-4" /> Predict Risk</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
