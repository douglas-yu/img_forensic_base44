import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ImageProvider } from '@/lib/imageContext';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import LoadEvidence from '@/pages/LoadEvidence';
import ImageViewer from '@/pages/ImageViewer';
import MetadataViewer from '@/pages/MetadataViewer';
import ELAAnalysis from '@/pages/ELAAnalysis';
import HistogramAnalysis from '@/pages/HistogramAnalysis';
import LuminanceGradient from '@/pages/LuminanceGradient';
import HexViewer from '@/pages/HexViewer';
import ForensicReport from '@/pages/ForensicReport';
import CaseManager from '@/pages/CaseManager';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-muted-foreground">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <ImageProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/load" element={<LoadEvidence />} />
          <Route path="/viewer" element={<ImageViewer />} />
          <Route path="/metadata" element={<MetadataViewer />} />
          <Route path="/ela" element={<ELAAnalysis />} />
          <Route path="/histogram" element={<HistogramAnalysis />} />
          <Route path="/luminance" element={<LuminanceGradient />} />
          <Route path="/hex" element={<HexViewer />} />
          <Route path="/report" element={<ForensicReport />} />
          <Route path="/cases" element={<CaseManager />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </ImageProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App