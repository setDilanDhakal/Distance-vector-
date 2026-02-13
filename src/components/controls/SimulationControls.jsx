import React, { useEffect, useState } from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

export const SimulationControls = () => {
  const { state, dispatch } = useSimulation();
  const { simulation } = state;
  const [speed, setSpeed] = useState(1000);

  useEffect(() => {
    let interval;
    if (simulation.isRunning) {
      interval = setInterval(() => {
        dispatch({ type: 'STEP_SIMULATION' });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [simulation.isRunning, speed, dispatch]);

  const handleAlgorithmChange = () => {};

  return (
    <Card className="rounded-none border-x-0 border-t-0 shadow-sm z-20 overflow-x-auto">
      <div className="p-3 flex items-center justify-between gap-4 min-w-max">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'RESET_SIMULATION' })}
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <Button
              variant={simulation.isRunning ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => dispatch({ type: 'TOGGLE_AUTO_RUN', payload: !simulation.isRunning })}
            >
              {simulation.isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" /> Run Auto
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: 'STEP_SIMULATION' })}
              disabled={simulation.isRunning}
              title="Next Step"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Step
            </Button>
          </div>

          
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Speed:</span>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              value={2100 - speed}
              onChange={(e) => setSpeed(2100 - parseInt(e.target.value))}
            />
          </div>

          <div className="bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
            <span className="text-sm font-bold text-blue-800">Step: {simulation.step}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
