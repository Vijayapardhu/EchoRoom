import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { WebRTCProvider } from './context/WebRTCContext';
import ErrorBoundary from './components/ErrorBoundary';
import PremiumLanding from './components/PremiumLanding';
import Onboarding from './components/Onboarding';
import Matching from './components/Matching';
import Room from './components/Room';
import PostChat from './components/PostChat';
import NotFound from './components/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <WebRTCProvider>
          <Router>
            <Routes>
              <Route path="/" element={<PremiumLanding />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/room/matching" element={<Matching />} />
              <Route path="/room/:roomId" element={<Room />} />
              <Route path="/post-chat" element={<PostChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </WebRTCProvider>
      </SocketProvider>
    </ErrorBoundary>
  );
}

export default App;
