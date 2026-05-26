import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { WebRTCProvider } from './context/WebRTCContext';
import ErrorBoundary from './components/ErrorBoundary';
import PremiumLanding from './components/PremiumLanding';
import Matching from './components/Matching';
import Room from './components/Room';
import PostChat from './components/PostChat';
import NotFound from './components/NotFound';
import JoinModal from './components/JoinModal';

function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <WebRTCProvider>
          <Toaster position="top-center" toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }
          }} />
          <Router>
            <Routes>
              <Route path="/" element={<PremiumLanding />} />
              <Route path="/matching" element={<Matching />} />
              <Route path="/room" element={<Room />} />
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
