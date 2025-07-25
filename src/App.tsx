import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { VerificationPage } from '@/components/VerificationPage';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DiscordCallback } from '@/components/DiscordCallback';
import { BotInterface } from '@/components/BotInterface';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default page is verification */}
        <Route path="/" element={<VerificationPage />} />
        
        {/* Verification with server ID */}
        <Route path="/verify/:serverId" element={<VerificationPage />} />
        
        {/* Discord OAuth callback */}
        <Route path="/auth/discord/callback" element={<DiscordCallback />} />
        
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