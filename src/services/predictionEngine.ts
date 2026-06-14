/**
 * Simulated ML prediction engine for early disease detection.
 * Implements rule-based logistic regression models with SHAP-style feature explanations.
 * Feature weights are based on published clinical literature coefficients.
 */

import type {
  DiabetesInputs,
  FeatureContribution,
  HeartInputs,
  PCOSInputs,
  PredictionResult,
  RiskLevel,
  StressInputs,
} from '@/types/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function riskLevel(prob: number): RiskLevel {
  if (prob < 33) return 'Low';
  if (prob < 67) return 'Medium';
  return 'High';
}

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Normalize SHAP contributions so the top feature has magnitude ~0.3
function normalizeContributions(contribs: FeatureContribution[]): FeatureContribution[] {
  const maxAbs = Math.max(...contribs.map((c) => Math.abs(c.contribution)), 0.001);
  return contribs.map((c) => ({
    ...c,
    contribution: (c.contribution / maxAbs) * 0.32,
    importance: Math.abs(c.contribution) / maxAbs,
  }));
}

// ── Diabetes ───────────────────────────────────────────────────────────────

export function predictDiabetes(inputs: DiabetesInputs): PredictionResult {
  const baseValue = 22; // population base risk %

  // Feature scores (logistic regression coefficients)
  const ageScore = clamp((inputs.age - 30) / 40, -1, 1) * 0.6;
  const bmiScore = clamp((inputs.bmi - 25) / 15, -1, 1) * 0.8;
  const glucoseScore = clamp((inputs.fastingGlucose - 100) / 60, -1, 1) * 1.4;
  const hba1cScore = clamp((inputs.hba1c - 5.7) / 2.3, -1, 1) * 1.5;
  const familyScore = inputs.familyHistory === 'yes' ? 0.6 : inputs.familyHistory === 'partial' ? 0.3 : -0.1;
  const activityScore =
    inputs.physicalActivity === 'sedentary' ? 0.5 : inputs.physicalActivity === 'light' ? 0.2 : inputs.physicalActivity === 'moderate' ? -0.2 : -0.5;
  const dietScore =
    inputs.dietaryHabits === 'unhealthy' ? 0.5 : inputs.dietaryHabits === 'average' ? 0.1 : -0.3;
  const genderScore = inputs.gender === 'male' ? 0.1 : -0.05;

  const logit = ageScore + bmiScore + glucoseScore + hba1cScore + familyScore + activityScore + dietScore + genderScore;
  const probability = Math.round(clamp(sigmoid(logit) * 85 + 10, 5, 95));

  const rawContribs: FeatureContribution[] = [
    { feature: 'hba1c', label: 'HbA1c Level', value: inputs.hba1c, contribution: hba1cScore, importance: 0 },
    { feature: 'fasting_glucose', label: 'Fasting Glucose', value: inputs.fastingGlucose, contribution: glucoseScore, importance: 0 },
    { feature: 'bmi', label: 'BMI', value: inputs.bmi, contribution: bmiScore, importance: 0 },
    { feature: 'family_history', label: 'Family History', value: inputs.familyHistory === 'yes' ? 1 : 0, contribution: familyScore, importance: 0 },
    { feature: 'age', label: 'Age', value: inputs.age, contribution: ageScore, importance: 0 },
    { feature: 'physical_activity', label: 'Physical Activity', value: inputs.physicalActivity === 'active' ? 3 : inputs.physicalActivity === 'moderate' ? 2 : 1, contribution: activityScore, importance: 0 },
    { feature: 'dietary_habits', label: 'Dietary Habits', value: inputs.dietaryHabits === 'healthy' ? 3 : inputs.dietaryHabits === 'average' ? 2 : 1, contribution: dietScore, importance: 0 },
    { feature: 'gender', label: 'Gender', value: inputs.gender === 'male' ? 1 : 0, contribution: genderScore, importance: 0 },
  ];

  const features = normalizeContributions(rawContribs).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topRisk = features.filter((f) => f.contribution > 0).slice(0, 3);
  const interpretation = [
    `Predicted diabetes risk is ${probability}% — classified as ${riskLevel(probability)} risk.`,
    ...topRisk.map((f) => `${f.label} is a major contributing factor increasing your risk.`),
    probability >= 67 ? 'Immediate consultation with an endocrinologist is strongly recommended.' : probability >= 33 ? 'Regular monitoring of blood glucose and HbA1c levels is advised.' : 'Continue maintaining healthy lifestyle habits.',
  ];

  return {
    id: uuid(),
    disease: 'diabetes',
    timestamp: new Date().toISOString(),
    probability,
    riskLevel: riskLevel(probability),
    features,
    baseValue,
    inputs: inputs as unknown as Record<string, string | number>,
    interpretation,
  };
}

// ── Heart Disease ──────────────────────────────────────────────────────────

export function predictHeart(inputs: HeartInputs): PredictionResult {
  const baseValue = 18;

  const ageScore = clamp((inputs.age - 35) / 35, -1, 1) * 0.8;
  const bpScore = clamp((inputs.systolicBP - 120) / 60, -1, 1) * 1.0;
  const cholScore = clamp((inputs.totalCholesterol - 200) / 100, -1, 1) * 0.9;
  const ldlScore = clamp((inputs.ldlCholesterol - 130) / 70, -1, 1) * 0.8;
  const hdlScore = clamp((60 - inputs.hdlCholesterol) / 40, -1, 1) * 0.7; // HDL is protective
  const smokingScore =
    inputs.smokingStatus === 'current' ? 1.0 : inputs.smokingStatus === 'former' ? 0.4 : -0.1;
  const familyScore = inputs.familyHistory === 'yes' ? 0.7 : inputs.familyHistory === 'partial' ? 0.3 : -0.1;
  const exerciseScore =
    inputs.exerciseFrequency === 'never' ? 0.5 : inputs.exerciseFrequency === 'rarely' ? 0.3 : inputs.exerciseFrequency === 'sometimes' ? -0.1 : -0.5;
  const chestPainScore =
    inputs.chestPainType === 'typical_angina' ? 1.1 : inputs.chestPainType === 'atypical_angina' ? 0.5 : inputs.chestPainType === 'non_anginal' ? 0.1 : -0.3;
  const genderScore = inputs.gender === 'male' ? 0.3 : -0.1;

  const logit = ageScore + bpScore + cholScore + ldlScore + hdlScore + smokingScore + familyScore + exerciseScore + chestPainScore + genderScore;
  const probability = Math.round(clamp(sigmoid(logit) * 85 + 8, 5, 95));

  const rawContribs: FeatureContribution[] = [
    { feature: 'chest_pain', label: 'Chest Pain Type', value: inputs.chestPainType === 'typical_angina' ? 4 : 1, contribution: chestPainScore, importance: 0 },
    { feature: 'smoking', label: 'Smoking Status', value: inputs.smokingStatus === 'current' ? 2 : 1, contribution: smokingScore, importance: 0 },
    { feature: 'age', label: 'Age', value: inputs.age, contribution: ageScore, importance: 0 },
    { feature: 'systolic_bp', label: 'Systolic BP', value: inputs.systolicBP, contribution: bpScore, importance: 0 },
    { feature: 'cholesterol', label: 'Total Cholesterol', value: inputs.totalCholesterol, contribution: cholScore, importance: 0 },
    { feature: 'ldl', label: 'LDL Cholesterol', value: inputs.ldlCholesterol, contribution: ldlScore, importance: 0 },
    { feature: 'hdl', label: 'HDL Cholesterol', value: inputs.hdlCholesterol, contribution: hdlScore, importance: 0 },
    { feature: 'family_history', label: 'Family History', value: inputs.familyHistory === 'yes' ? 1 : 0, contribution: familyScore, importance: 0 },
    { feature: 'exercise', label: 'Exercise Frequency', value: inputs.exerciseFrequency === 'regular' ? 4 : 1, contribution: exerciseScore, importance: 0 },
    { feature: 'gender', label: 'Gender', value: inputs.gender === 'male' ? 1 : 0, contribution: genderScore, importance: 0 },
  ];

  const features = normalizeContributions(rawContribs).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topRisk = features.filter((f) => f.contribution > 0).slice(0, 3);
  const interpretation = [
    `Cardiovascular risk score: ${probability}% — ${riskLevel(probability)} risk category.`,
    ...topRisk.map((f) => `${f.label} significantly elevates your cardiovascular risk.`),
    probability >= 67 ? 'Urgent cardiac evaluation recommended — consult a cardiologist.' : probability >= 33 ? 'Lifestyle modifications and regular BP/cholesterol monitoring are advised.' : 'Continue cardiovascular health maintenance practices.',
  ];

  return {
    id: uuid(),
    disease: 'heart',
    timestamp: new Date().toISOString(),
    probability,
    riskLevel: riskLevel(probability),
    features,
    baseValue,
    inputs: inputs as unknown as Record<string, string | number>,
    interpretation,
  };
}

// ── PCOS ───────────────────────────────────────────────────────────────────

export function predictPCOS(inputs: PCOSInputs): PredictionResult {
  const baseValue = 20;

  const bmiScore = clamp((inputs.bmi - 24) / 14, -1, 1) * 0.7;
  const menstrualScore =
    inputs.menstrualRegularity === 'irregular' ? 1.3 : inputs.menstrualRegularity === 'very_irregular' ? 1.8 : -0.2;
  const hirsutismScore =
    inputs.hirsutism === 'severe' ? 1.0 : inputs.hirsutism === 'moderate' ? 0.6 : inputs.hirsutism === 'mild' ? 0.2 : -0.3;
  const acneScore =
    inputs.acneSeverity === 'severe' ? 0.7 : inputs.acneSeverity === 'moderate' ? 0.4 : inputs.acneSeverity === 'mild' ? 0.1 : -0.2;
  const weightGainScore =
    inputs.weightGainPattern === 'rapid_central' ? 0.9 : inputs.weightGainPattern === 'gradual' ? 0.4 : -0.1;
  const familyScore = inputs.familyHistory === 'yes' ? 0.6 : inputs.familyHistory === 'partial' ? 0.3 : -0.1;
  const insulinScore =
    inputs.insulinResistance === 'high' ? 0.9 : inputs.insulinResistance === 'moderate' ? 0.4 : -0.2;
  const ageScore = clamp((inputs.age - 20) / 15, -0.5, 0.5) * 0.3;

  const logit = bmiScore + menstrualScore + hirsutismScore + acneScore + weightGainScore + familyScore + insulinScore + ageScore;
  const probability = Math.round(clamp(sigmoid(logit) * 85 + 8, 5, 95));

  const rawContribs: FeatureContribution[] = [
    { feature: 'menstrual', label: 'Menstrual Irregularity', value: inputs.menstrualRegularity === 'regular' ? 1 : inputs.menstrualRegularity === 'irregular' ? 2 : 3, contribution: menstrualScore, importance: 0 },
    { feature: 'insulin_resistance', label: 'Insulin Resistance', value: inputs.insulinResistance === 'low' ? 1 : inputs.insulinResistance === 'moderate' ? 2 : 3, contribution: insulinScore, importance: 0 },
    { feature: 'hirsutism', label: 'Excess Hair Growth', value: inputs.hirsutism === 'none' ? 1 : inputs.hirsutism === 'mild' ? 2 : inputs.hirsutism === 'moderate' ? 3 : 4, contribution: hirsutismScore, importance: 0 },
    { feature: 'bmi', label: 'BMI', value: inputs.bmi, contribution: bmiScore, importance: 0 },
    { feature: 'weight_gain', label: 'Weight Gain Pattern', value: inputs.weightGainPattern === 'stable' ? 1 : inputs.weightGainPattern === 'gradual' ? 2 : 3, contribution: weightGainScore, importance: 0 },
    { feature: 'family_history', label: 'Family History (PCOS)', value: inputs.familyHistory === 'yes' ? 1 : 0, contribution: familyScore, importance: 0 },
    { feature: 'acne', label: 'Acne Severity', value: inputs.acneSeverity === 'none' ? 1 : inputs.acneSeverity === 'mild' ? 2 : inputs.acneSeverity === 'moderate' ? 3 : 4, contribution: acneScore, importance: 0 },
    { feature: 'age', label: 'Age', value: inputs.age, contribution: ageScore, importance: 0 },
  ];

  const features = normalizeContributions(rawContribs).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topRisk = features.filter((f) => f.contribution > 0).slice(0, 3);
  const interpretation = [
    `PCOS likelihood score: ${probability}% — ${riskLevel(probability)} risk assessment.`,
    ...topRisk.map((f) => `${f.label} is a key indicator associated with PCOS.`),
    probability >= 67 ? 'Pelvic ultrasound and hormonal panel tests recommended — see a gynecologist.' : probability >= 33 ? 'Monitor hormone levels and consider lifestyle interventions for insulin sensitivity.' : 'Current indicators suggest low PCOS risk. Maintain regular gynecological check-ups.',
  ];

  return {
    id: uuid(),
    disease: 'pcos',
    timestamp: new Date().toISOString(),
    probability,
    riskLevel: riskLevel(probability),
    features,
    baseValue,
    inputs: inputs as unknown as Record<string, string | number>,
    interpretation,
  };
}

// ── Stress / Anxiety ───────────────────────────────────────────────────────

export function predictStress(inputs: StressInputs): PredictionResult {
  const baseValue = 25;

  const sleepScore =
    inputs.sleepQuality === 'very_poor' ? 1.2 : inputs.sleepQuality === 'poor' ? 0.8 : inputs.sleepQuality === 'fair' ? 0.3 : inputs.sleepQuality === 'good' ? -0.3 : -0.7;
  const workScore = clamp((inputs.workHoursPerWeek - 40) / 30, -1, 1) * 0.9;
  const socialScore =
    inputs.socialSupport === 'none' ? 1.0 : inputs.socialSupport === 'low' ? 0.6 : inputs.socialSupport === 'moderate' ? 0.0 : -0.5;
  const physicalScore =
    inputs.physicalSymptoms === 'severe' ? 0.9 : inputs.physicalSymptoms === 'moderate' ? 0.5 : inputs.physicalSymptoms === 'mild' ? 0.1 : -0.3;
  const moodScore =
    inputs.moodPatterns === 'frequently_anxious' ? 1.1 : inputs.moodPatterns === 'sometimes_anxious' ? 0.5 : inputs.moodPatterns === 'neutral' ? 0.0 : -0.5;
  const copingScore =
    inputs.copingMechanisms === 'unhealthy' ? 0.7 : inputs.copingMechanisms === 'limited' ? 0.3 : inputs.copingMechanisms === 'moderate' ? -0.1 : -0.6;
  const ageScore = inputs.age >= 18 && inputs.age <= 35 ? 0.2 : inputs.age > 55 ? -0.1 : 0.0;
  const genderScore = inputs.gender === 'female' ? 0.15 : inputs.gender === 'non_binary' ? 0.1 : 0.0;

  const logit = sleepScore + workScore + socialScore + physicalScore + moodScore + copingScore + ageScore + genderScore;
  const probability = Math.round(clamp(sigmoid(logit) * 85 + 10, 5, 95));

  const rawContribs: FeatureContribution[] = [
    { feature: 'mood', label: 'Mood Patterns', value: inputs.moodPatterns === 'frequently_anxious' ? 4 : 1, contribution: moodScore, importance: 0 },
    { feature: 'sleep', label: 'Sleep Quality', value: inputs.sleepQuality === 'very_poor' ? 1 : inputs.sleepQuality === 'poor' ? 2 : 3, contribution: sleepScore, importance: 0 },
    { feature: 'social_support', label: 'Social Support Level', value: inputs.socialSupport === 'none' ? 1 : inputs.socialSupport === 'low' ? 2 : 3, contribution: socialScore, importance: 0 },
    { feature: 'work_hours', label: 'Work Hours / Week', value: inputs.workHoursPerWeek, contribution: workScore, importance: 0 },
    { feature: 'physical_symptoms', label: 'Physical Symptoms', value: inputs.physicalSymptoms === 'severe' ? 4 : 1, contribution: physicalScore, importance: 0 },
    { feature: 'coping', label: 'Coping Mechanisms', value: inputs.copingMechanisms === 'healthy' ? 4 : 1, contribution: copingScore, importance: 0 },
    { feature: 'age', label: 'Age', value: inputs.age, contribution: ageScore, importance: 0 },
    { feature: 'gender', label: 'Gender', value: inputs.gender === 'female' ? 2 : 1, contribution: genderScore, importance: 0 },
  ];

  const features = normalizeContributions(rawContribs).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topRisk = features.filter((f) => f.contribution > 0).slice(0, 3);
  const interpretation = [
    `Stress/Anxiety risk index: ${probability}% — ${riskLevel(probability)} stress burden.`,
    ...topRisk.map((f) => `${f.label} is a significant stress amplifier in your profile.`),
    probability >= 67 ? 'Clinical-level stress/anxiety detected. Psychological support or therapy is strongly recommended.' : probability >= 33 ? 'Moderate stress indicators found. Consider mindfulness, exercise, and work-life balance improvements.' : 'Stress levels appear manageable. Maintain current healthy coping strategies.',
  ];

  return {
    id: uuid(),
    disease: 'stress',
    timestamp: new Date().toISOString(),
    probability,
    riskLevel: riskLevel(probability),
    features,
    baseValue,
    inputs: inputs as unknown as Record<string, string | number>,
    interpretation,
  };
}
