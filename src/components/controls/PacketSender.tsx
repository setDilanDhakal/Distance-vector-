import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Button } from '../ui/Button';
import { Send, CheckCircle2, XCircle, ArrowRight, StopCircle } from 'lucide-react';
import { Card } from '../ui/Card';

export const PacketSender = () => {
    const { state, dispatch } = useSimulation();
    const { topology, simulation } = state;
    const [source, setSource] = useState<string>('');
    const [target, setTarget] = useState<string>('');
    const [pathResult, setPathResult] = useState<{ found: boolean, path: string[], cost: number } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [runCountInput, setRunCountInput] = useState<string>('1');
    const [runMode, setRunMode] = useState<'once' | 'loop' | 'count'>('once');

    // Reset selection if nodes change
    useEffect(() => {
        if (source && !topology.nodes.find(n => n.id === source)) setSource('');
        if (target && !topology.nodes.find(n => n.id === target)) setTarget('');
    }, [topology.nodes, source, target]);

    const stopSending = () => {
        setIsSending(false);
        dispatch({ type: 'CLEAR_PACKET_ANIMATION' });
    };

    const findPath = () => {
        if (!source || !target || source === target) return;

        // Trace path using routing tables
        const path: string[] = [source];
        let current = source;
        let totalCost = 0;
        let found = false;
        const maxHops = topology.nodes.length + 2; // Prevent infinite loops
        let hops = 0;

        while (hops < maxHops) {
            const nodeState = simulation.nodeStates[current];
            if (!nodeState) break; // Should not happen if initialized

            const route = nodeState.routingTable[target];
            
            // If cost is infinite, no path
            if (!route || route.cost >= 999) { // 999 is our INFINITY constant usually
                break;
            }

            if (current === target) {
                found = true;
                break;
            }

            // Next hop
            const next = route.nextHop;
            if (!next) {
                // Direct connection check or arrived?
                if (current === target) found = true;
                break;
            }

            // Correctly set total cost from the source's knowledge
            if (current === source) {
                totalCost = route.cost;
            }

            path.push(next);
            current = next;
            hops++;

            // Force break if we loop back to an already visited node (simple cycle detection)
            if (path.slice(0, -1).includes(next)) {
                // Cycle detected
                found = false;
                break;
            }

            if (current === target) {
                found = true;
                break;
            }
        }

        if (found) {
            setPathResult({ found: true, path, cost: totalCost });
            setIsSending(true);
            
            let runCount = 1;
            let loop = false;
            
            if (runMode === 'loop') {
                loop = true;
                runCount = -1; // Infinite
            } else if (runMode === 'count') {
                loop = true;
                runCount = parseInt(runCountInput) || 1;
            } else {
                // Once
                loop = false;
                runCount = 1;
            }

            dispatch({ 
                type: 'START_PACKET_ANIMATION', 
                payload: { 
                    path, 
                    currentStep: 0, 
                    loop,
                    runCount
                } 
            });
        } else {
            setPathResult({ found: false, path: [], cost: 0 });
            setTimeout(() => setPathResult(null), 3000);
        }
    };

    return (
        <Card className="rounded-none border-x-0 border-t-0 shadow-sm z-20 bg-slate-50">
            <div className="p-3 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Data Transfer:</span>
                    <select 
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border px-2 py-1 w-32"
                        value={source}
                        onChange={(e) => { setSource(e.target.value); setPathResult(null); stopSending(); }}
                        disabled={isSending}
                    >
                        <option value="">Source</option>
                        {topology.nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                    </select>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <select 
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border px-2 py-1 w-32"
                        value={target}
                        onChange={(e) => { setTarget(e.target.value); setPathResult(null); stopSending(); }}
                        disabled={isSending}
                    >
                        <option value="">Destination</option>
                        {topology.nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center gap-2 border-l pl-4 border-gray-300">
                    <span className="text-sm text-gray-600">Mode:</span>
                    <select 
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border px-2 py-1"
                        value={runMode}
                        onChange={(e) => setRunMode(e.target.value as any)}
                        disabled={isSending}
                    >
                        <option value="once">Run Once</option>
                        <option value="loop">Continuous</option>
                        <option value="count">Fixed Count</option>
                    </select>
                    
                    {runMode === 'count' && (
                        <input 
                            type="number" 
                            min="1" 
                            max="100"
                            className="w-16 px-2 py-1 text-sm border rounded"
                            value={runCountInput}
                            onChange={(e) => setRunCountInput(e.target.value)}
                            disabled={isSending}
                        />
                    )}
                </div>

                {!isSending ? (
                    <Button 
                        size="sm" 
                        onClick={findPath}
                        disabled={!source || !target || source === target}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Send className="w-3 h-3 mr-1" />
                        Start
                    </Button>
                ) : (
                    <Button 
                        size="sm" 
                        onClick={stopSending}
                        variant="danger"
                    >
                        <StopCircle className="w-3 h-3 mr-1" />
                        Stop
                    </Button>
                )}

                {pathResult && (
                    <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full animate-in fade-in ${pathResult.found ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {pathResult.found ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Path Found! Cost: {pathResult.cost}</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4" />
                                <span>Unreachable</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
