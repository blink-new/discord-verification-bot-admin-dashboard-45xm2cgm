import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { VerificationPage } from '@/components/VerificationPage';
import { AdminDashboard } from '@/components/AdminDashboard';
import { BotInterface } from '@/components/BotInterface';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default page is verification */}
        <Route path="/" element={<VerificationPage />} />
        
        {/* Admin panel at /admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Bot interface for testing commands */}
        <Route path="/bot" element={<BotInterface />} />
        
        {/* Redirect any unknown routes to verification */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;