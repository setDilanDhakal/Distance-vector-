import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Send, CheckCircle2, XCircle, ArrowRight, StopCircle } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { initializeNodeState, runDistanceVectorStep, INFINITY } from '../../utils/algorithm.js';
import { runOSPFStep, computeSecondBestPath } from '../../utils/ospf.js';

export const PacketSender = () => {
  const { state, dispatch } = useSimulation();
  const { topology, simulation } = state;
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [pathResult, setPathResult] = useState(null);
  const [showPathPopup, setShowPathPopup] = useState(false);
  const [pathPopup, setPathPopup] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [runCountInput, setRunCountInput] = useState('1');
  const [runMode, setRunMode] = useState('once');

  useEffect(() => {
    if (source && !topology.nodes.find(n => n.id === source)) setSource('');
    if (target && !topology.nodes.find(n => n.id === target)) setTarget('');
  }, [topology.nodes, source, target]);

  useEffect(() => {
    if (!source || !target) {
      const nodes = [...topology.nodes].sort((a, b) => a.label.localeCompare(b.label));
      if (!source && nodes[0]) setSource(nodes[0].id);
      if (!target && nodes[1]) {
        const defaultTarget = nodes[1].id === source && nodes[2] ? nodes[2].id : nodes[1].id;
        setTarget(defaultTarget);
      }
    }
  }, [topology.nodes, source, target]);

  const stopSending = () => {
    setIsSending(false);
    dispatch({ type: 'CLEAR_PACKET_ANIMATION' });
  };

  const findPath = () => {
    if (!source || !target || source === target) return;

    let workingStates = simulation.nodeStates;
    if (!workingStates || Object.keys(workingStates).length === 0) {
      const initStates = {};
      topology.nodes.forEach(node => {
        initStates[node.id] = initializeNodeState(node.id, topology);
      });
      if (simulation.routingMode === 'ospf') {
        const res = runOSPFStep(topology, initStates);
        workingStates = res.nextStates;
      } else {
        workingStates = initStates;
      }
    }
    let routeFromSource = workingStates[source]?.routingTable?.[target];
    if (!routeFromSource || routeFromSource.cost >= INFINITY) {
      if (simulation.routingMode === 'dv') {
        let tmpStates = workingStates;
        const iterations = topology.nodes.length * 4;
        for (let i = 0; i < iterations; i++) {
          const step = runDistanceVectorStep(topology, tmpStates);
          tmpStates = step.nextStates;
          const r = tmpStates[source]?.routingTable?.[target];
          if (r && r.cost < INFINITY) {
            workingStates = tmpStates;
            routeFromSource = r;
            break;
          }
        }
        if (routeFromSource && routeFromSource.cost < INFINITY) {
          dispatch({ type: 'HYDRATE_NODE_STATES', payload: { nodeStates: workingStates } });
        }
      } else {
        const res = runOSPFStep(topology, workingStates);
        workingStates = res.nextStates;
        routeFromSource = workingStates[source]?.routingTable?.[target];
        if (routeFromSource && routeFromSource.cost < INFINITY) {
          dispatch({ type: 'HYDRATE_NODE_STATES', payload: { nodeStates: workingStates } });
        }
      }
    }

    const path = [source];
    let current = source;
    let totalCost = 0;
    let found = false;
    const maxHops = topology.nodes.length + 2;
    let hops = 0;

    while (hops < maxHops) {
      const nodeState = workingStates[current];
      if (!nodeState) break;
      const route = nodeState.routingTable[target];
      if (!route || route.cost >= INFINITY) {
        break;
      }
      if (current === target) {
        found = true;
        break;
      }
      const next = route.nextHop;
      if (!next) {
        if (current === target) found = true;
        break;
      }
      if (current === source) {
        totalCost = route.cost;
      }
      path.push(next);
      current = next;
      hops++;
      if (path.slice(0, -1).includes(next)) {
        found = false;
        break;
      }
      if (current === target) {
        found = true;
        break;
      }
    }

    let altPath = null;
    if (simulation.routingMode === 'ospf') {
      altPath = computeSecondBestPath(topology, source, target);
    }
    if (found) {
      setPathResult({ found: true, path, cost: totalCost, mode: simulation.routingMode });
      if (simulation.routingMode === 'ospf') {
        const calcCost = (p) => {
          if (!p || p.length < 2) return 0;
          let cost = 0;
          for (let i = 0; i < p.length - 1; i++) {
            const u = p[i];
            const v = p[i + 1];
            const link = topology.links.find(l =>
              (l.source === u && l.target === v) || (l.source === v && l.target === u)
            );
            if (!link) return INFINITY;
            cost += link.cost;
          }
          return cost;
        };
        setPathPopup({
          mode: 'ospf',
          shortest: { path, cost: totalCost },
          alternate: altPath ? { path: altPath, cost: calcCost(altPath) } : null
        });
        setShowPathPopup(true);
      }
      setIsSending(true);
      let runCount = 1;
      let loop = false;
      if (runMode === 'loop') {
        loop = true;
        runCount = -1;
      } else if (runMode === 'count') {
        loop = true;
        runCount = parseInt(runCountInput) || 1;
      } else {
        loop = false;
        runCount = 1;
      }
      dispatch({
        type: 'START_PACKET_ANIMATION',
        payload: {
          path,
          altPath,
          currentStep: 0,
          loop,
          runCount,
          nonce: Date.now()
        }
      });
    } else {
      setPathResult({ found: false, path: [], cost: 0, mode: simulation.routingMode });
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
            onChange={(e) => setRunMode(e.target.value)}
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
                <span>{pathResult.mode === 'ospf' ? 'OSPF Shortest Path' : 'Path'} Cost: {pathResult.cost}</span>
                <span className="ml-2 text-xs bg-white/60 text-gray-700 px-2 py-0.5 rounded">
                  {pathResult.path.map(id => topology.nodes.find(n => n.id === id)?.label || id.substring(0, 4)).join(' → ')}
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Unreachable</span>
              </>
            )}
          </div>
        )}
        {showPathPopup && pathPopup?.mode === 'ospf' && (
          <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-[380px] pointer-events-auto">
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">OSPF Path Calculation</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPathPopup(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-3 space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded bg-red-500"></span>
                    <span className="font-medium text-gray-900">Shortest Path</span>
                    <span className="ml-auto text-[10px] text-gray-600">Cost: {pathPopup.shortest.cost}</span>
                  </div>
                  <div className="text-gray-700">
                    {pathPopup.shortest.path.map(id => topology.nodes.find(n => n.id === id)?.label || id.substring(0, 4)).join(' → ')}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded bg-emerald-500"></span>
                    <span className="font-medium text-gray-900">Optimal Alternate Path</span>
                    <span className="ml-auto text-[10px] text-gray-600">
                      {pathPopup.alternate ? `Cost: ${pathPopup.alternate.cost}` : 'None'}
                    </span>
                  </div>
                  <div className="text-gray-700">
                    {pathPopup.alternate
                      ? pathPopup.alternate.path.map(id => topology.nodes.find(n => n.id === id)?.label || id.substring(0, 4)).join(' → ')
                      : 'No alternate route available'}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => setShowPathPopup(false)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
