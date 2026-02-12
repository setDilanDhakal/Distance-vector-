import React, { useEffect, useRef } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { ScrollText } from 'lucide-react';

export const LogPanel = () => {
  const { state } = useSimulation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.simulation.messages]);

  return (
    <Card className="h-full flex flex-col border-t border-gray-200 rounded-none shadow-none">
      <CardHeader className="py-2 bg-slate-50 border-b flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">Simulation Logs</span>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y divide-gray-100">
            {state.simulation.messages.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm italic">
                    Simulation ready. Start to see updates.
                </div>
            )}
            {state.simulation.messages.map((msg) => (
                <div key={msg.id} className="p-2 text-xs hover:bg-gray-50 flex gap-2">
                    <span className="text-gray-400 font-mono flex-none w-16">
                        {msg.id.split('-')[0] || '0'}
                    </span>
                    <span className={`flex-1 ${msg.type === 'error' ? 'text-red-600' : msg.type === 'info' ? 'text-blue-600' : 'text-gray-800'}`}>
                        {msg.content}
                    </span>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
      </CardContent>
    </Card>
  );
};
