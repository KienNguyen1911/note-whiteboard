import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex w-screen h-screen bg-slate-100 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 relative">
          <Routes>
            {/* Route for specific board */}
            <Route path="/board/:pageId" element={<WhiteboardCanvas />} />
            
            {/* Default redirect - Sidebar will handle initial navigation, 
                but good to have a catch-all
            */}
            <Route path="/" element={
                 <div className="flex items-center justify-center h-full text-slate-400">
                     Select a board to start
                 </div>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;