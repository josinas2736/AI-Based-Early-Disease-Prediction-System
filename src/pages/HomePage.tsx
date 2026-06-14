import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ArrowRight, Brain, ClipboardList, GitCompare, Heart, Shield, Zap } from 'lucide-react';

const diseases = [
  {
    path: '/predict/diabetes',
    icon: Activity,
    title: 'Diabetes',
    description: 'Assess diabetes risk using blood glucose, HbA1c, BMI, and lifestyle indicators.',
    color: 'text-[hsl(185,84%,29%)]',
    bgColor: 'bg-[hsl(185,84%,95%)] dark:bg-[hsl(185,30%,15%)]',
    tag: 'Metabolic',
  },
  {
    path: '/predict/heart',
    icon: Heart,
    title: 'Heart Disease',
    description: 'Evaluate cardiovascular risk via blood pressure, cholesterol, and ECG indicators.',
    color: 'text-[hsl(0,72%,51%)]',
    bgColor: 'bg-[hsl(0,72%,96%)] dark:bg-[hsl(0,60%,14%)]',
    tag: 'Cardiovascular',
  },
  {
    path: '/predict/pcos',
    icon: Zap,
    title: 'PCOS',
    description: 'Detect PCOS likelihood through hormonal, menstrual, and metabolic markers.',
    color: 'text-[hsl(38,92%,40%)]',
    bgColor: 'bg-[hsl(38,92%,95%)] dark:bg-[hsl(38,60%,14%)]',
    tag: 'Hormonal',
  },
  {
    path: '/predict/stress',
    icon: Brain,
    title: 'Stress / Anxiety',
    description: 'Quantify psychological stress using sleep, work load, social, and mood patterns.',
    color: 'text-[hsl(199,89%,38%)]',
    bgColor: 'bg-[hsl(199,89%,94%)] dark:bg-[hsl(199,60%,14%)]',
    tag: 'Mental Health',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Explainable AI (XAI)',
    desc: 'SHAP-style feature contributions reveal exactly why each prediction was made.',
  },
  {
    icon: Activity,
    title: 'Multi-Disease Panel',
    desc: 'Four clinically validated predictive models in one unified dashboard.',
  },
  {
    icon: ClipboardList,
    title: 'Session History',
    desc: 'Track and review all prediction sessions with complete audit trails.',
  },
  {
    icon: GitCompare,
    title: 'Comparative Analysis',
    desc: 'Visualize risk trends across multiple sessions and disease types.',
  },
];

export default function HomePage() {
  return (
    <div className="p-4 md:p-8 space-y-10 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 bg-secondary text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
          <Shield className="w-3.5 h-3.5" />
          Clinical Decision Support System
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
          AI-Based Early Disease<br />Prediction System
        </h1>
        <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto text-pretty">
          A research-grade platform combining machine learning with explainable AI to provide
          transparent, interpretable risk assessments for four major health conditions.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to="/predict/diabetes">
            <Button size="lg" className="gap-2">
              <Activity className="w-4 h-4" />
              Start Assessment
            </Button>
          </Link>
          <Link to="/history">
            <Button size="lg" variant="outline" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              View History
            </Button>
          </Link>
        </div>
      </div>

      {/* Disease cards */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Select Prediction Module</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diseases.map(({ path, icon: Icon, title, description, color, bgColor, tag }) => (
            <Link key={path} to={path} className="group">
              <Card className="h-full border hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full mt-1 shrink-0">
                      {tag}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-balance">{title}</CardTitle>
                  <CardDescription className="text-pretty">{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Run Prediction <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 text-pretty">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Research note */}
      <div className="bg-secondary rounded-xl p-5 border border-border">
        <p className="text-sm font-semibold text-foreground mb-1">Research & Publication Note</p>
        <p className="text-sm text-muted-foreground text-pretty">
          This system implements an XAI-driven clinical decision support framework aligned with IEEE
          publication standards. All predictions include SHAP-style waterfall plots, feature
          importance rankings, and plain-language interpretations — enabling transparent, auditable
          AI in healthcare. <span className="font-medium text-foreground">Not a substitute for professional medical advice.</span>
        </p>
      </div>
    </div>
  );
}
