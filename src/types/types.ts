export type DiseaseType = 'diabetes' | 'heart' | 'pcos' | 'stress';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface FeatureContribution {
  feature: string;
  label: string;
  value: number;
  contribution: number; // SHAP value: positive increases risk, negative decreases
  importance: number; // 0-1 normalized importance
}

export interface PredictionResult {
  id: string;
  disease: DiseaseType;
  timestamp: string;
  probability: number; // 0-100
  riskLevel: RiskLevel;
  features: FeatureContribution[];
  baseValue: number; // SHAP base value (average prediction)
  inputs: Record<string, string | number>;
  interpretation: string[];
}

// --- Diabetes ---
export interface DiabetesInputs {
  age: number;
  gender: string;
  bmi: number;
  fastingGlucose: number;
  hba1c: number;
  familyHistory: string;
  physicalActivity: string;
  dietaryHabits: string;
}

// --- Heart Disease ---
export interface HeartInputs {
  age: number;
  gender: string;
  systolicBP: number;
  diastolicBP: number;
  totalCholesterol: number;
  ldlCholesterol: number;
  hdlCholesterol: number;
  smokingStatus: string;
  familyHistory: string;
  exerciseFrequency: string;
  chestPainType: string;
}

// --- PCOS ---
export interface PCOSInputs {
  age: number;
  bmi: number;
  menstrualRegularity: string;
  hirsutism: string;
  acneSeverity: string;
  weightGainPattern: string;
  familyHistory: string;
  insulinResistance: string;
}

// --- Stress/Anxiety ---
export interface StressInputs {
  age: number;
  gender: string;
  sleepQuality: string;
  workHoursPerWeek: number;
  socialSupport: string;
  physicalSymptoms: string;
  moodPatterns: string;
  copingMechanisms: string;
}
