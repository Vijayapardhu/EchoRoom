import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { WebRTCProvider } from './context/WebRTCContext';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Room from './components/Room';

function App() {
  return (
    <SocketProvider>
      <WebRTCProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/room/:roomId" element={<Room />} />
          </Routes>
        </Router>
      </WebRTCProvider>
    </SocketProvider>
  );
}

export default App;
