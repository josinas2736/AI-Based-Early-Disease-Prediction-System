import type { ReactNode } from 'react';
import HomePage from './pages/HomePage';
import DiabetesForm from './pages/DiabetesForm';
import HeartForm from './pages/HeartForm';
import PCOSForm from './pages/PCOSForm';
import StressForm from './pages/StressForm';
import ResultsPage from './pages/ResultsPage';
import XAIDashboard from './pages/XAIDashboard';
import HistoryPage from './pages/HistoryPage';
import ComparePage from './pages/ComparePage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
    public: true,
  },
  {
    name: 'Diabetes Prediction',
    path: '/predict/diabetes',
    element: <DiabetesForm />,
    public: true,
  },
  {
    name: 'Heart Disease Prediction',
    path: '/predict/heart',
    element: <HeartForm />,
    public: true,
  },
  {
    name: 'PCOS Prediction',
    path: '/predict/pcos',
    element: <PCOSForm />,
    public: true,
  },
  {
    name: 'Stress/Anxiety Prediction',
    path: '/predict/stress',
    element: <StressForm />,
    public: true,
  },
  {
    name: 'Prediction Results',
    path: '/results/:id',
    element: <ResultsPage />,
    public: true,
  },
  {
    name: 'XAI Dashboard',
    path: '/xai/:id',
    element: <XAIDashboard />,
    public: true,
  },
  {
    name: 'Patient History',
    path: '/history',
    element: <HistoryPage />,
    public: true,
  },
  {
    name: 'Comparative Analysis',
    path: '/compare',
    element: <ComparePage />,
    public: true,
  },
];
