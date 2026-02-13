import React from 'react';
import { SimulationProvider } from './context/SimulationContext.jsx';
import { SimulationPage } from './pages/SimulationPage.jsx';

function App() {
  return (
    <SimulationProvider>
      <SimulationPage />
    </SimulationProvider>
  );
}

export default App;
