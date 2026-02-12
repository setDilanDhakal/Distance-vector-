import React from 'react';
import { SimulationProvider } from './context/SimulationContext';
import { SimulationPage } from './pages/SimulationPage';

function App() {
  return (
    <SimulationProvider>
      <SimulationPage />
    </SimulationProvider>
  );
}

export default App;
