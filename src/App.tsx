import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import FlightPriceIntelligence from './page/FlightPriceIntelligence';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161b22',
            color: '#f0f6fc',
            border: '1px solid #30363d',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#161b22',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#161b22',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<FlightPriceIntelligence />} />
        <Route path="/flight-price-intelligence" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
