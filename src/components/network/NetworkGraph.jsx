import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useSimulation } from '../../context/SimulationContext.jsx';

export const NetworkGraph = ({ width = 800, height = 600, onNodeClick, onLinkClick, mode = 'view' }) => {
  const svgRef = useRef(null);
  const { state, dispatch } = useSimulation();
  const { topology } = state;

  const [sourceNodeId, setSourceNodeId] = useState(null);
  const graphGroupRef = useRef(null);
  const overlayRef = useRef(null);
  const activePacketRef = useRef(state.simulation.activePacket);
  useEffect(() => {
    activePacketRef.current = state.simulation.activePacket;
  }, [state.simulation.activePacket]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();
    const g = svg.append('g');
    graphGroupRef.current = g;

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom);

    const linkGroup = g.append('g').attr('class', 'links');
    const linkElements = linkGroup
      .selectAll('line')
      .data(topology.links)
      .enter()
      .append('g')
      .attr('class', 'link-group')
      .on('click', (event, d) => {
        if (mode === 'view') {
          onLinkClick?.(d.id);
        }
      });

    linkElements.append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('x1', (d) => topology.nodes.find(n => n.id === d.source)?.x || 0)
      .attr('y1', (d) => topology.nodes.find(n => n.id === d.source)?.y || 0)
      .attr('x2', (d) => topology.nodes.find(n => n.id === d.target)?.x || 0)
      .attr('y2', (d) => topology.nodes.find(n => n.id === d.target)?.y || 0);

    linkElements.append('text')
      .attr('x', (d) => {
        const s = topology.nodes.find(n => n.id === d.source);
        const t = topology.nodes.find(n => n.id === d.target);
        return ((s?.x || 0) + (t?.x || 0)) / 2;
      })
      .attr('y', (d) => {
        const s = topology.nodes.find(n => n.id === d.source);
        const t = topology.nodes.find(n => n.id === d.target);
        return ((s?.y || 0) + (t?.y || 0)) / 2;
      })
      .attr('dy', -5)
      .attr('text-anchor', 'middle')
      .text((d) => d.cost)
      .attr('fill', '#666')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('class', 'select-none bg-white');

    linkElements.select('text')
      .attr('stroke', 'white')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .clone(true)
      .attr('stroke-width', 0);

    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup
      .selectAll('g')
      .data(topology.nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        if (mode === 'add-link') {
          if (sourceNodeId === null) {
            setSourceNodeId(d.id);
          } else {
            if (sourceNodeId !== d.id) {
              const exists = topology.links.some(l =>
                (l.source === sourceNodeId && l.target === d.id) ||
                (l.source === d.id && l.target === sourceNodeId)
              );
              if (!exists) {
                dispatch({ type: 'ADD_LINK', payload: { source: sourceNodeId, target: d.id, cost: 1 } });
              }
              setSourceNodeId(null);
            } else {
              setSourceNodeId(null);
            }
          }
        } else {
          onNodeClick?.(d.id);
        }
      });

    nodeElements.append('circle')
      .attr('r', 20)
      .attr('fill', (d) => d.id === sourceNodeId ? '#10b981' : '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cursor', mode === 'view' ? 'grab' : 'pointer');

    nodeElements.append('text')
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .text((d) => d.label)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
      .attr('font-weight', 'bold');

    function dragstarted(event, d) {
      if (mode !== 'view') return;
      d3.select(this).raise().attr('cursor', 'grabbing');
    }

    function dragged(event, d) {
      if (mode !== 'view') return;
      d.x = event.x;
      d.y = event.y;
      d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
      linkElements.select('line')
        .attr('x1', (l) => topology.nodes.find(n => n.id === l.source)?.x || 0)
        .attr('y1', (l) => topology.nodes.find(n => n.id === l.source)?.y || 0)
        .attr('x2', (l) => topology.nodes.find(n => n.id === l.target)?.x || 0)
        .attr('y2', (l) => topology.nodes.find(n => n.id === l.target)?.y || 0);
      linkElements.selectAll('text')
        .attr('x', (l) => {
          const s = topology.nodes.find(n => n.id === l.source);
          const t = topology.nodes.find(n => n.id === l.target);
          return ((s?.x || 0) + (t?.x || 0)) / 2;
        })
        .attr('y', (l) => {
          const s = topology.nodes.find(n => n.id === l.source);
          const t = topology.nodes.find(n => n.id === l.target);
          return ((s?.y || 0) + (t?.y || 0)) / 2;
        });
    }

    function dragended(event, d) {
      if (mode !== 'view') return;
      d3.select(this).attr('cursor', 'grab');
      dispatch({ type: 'UPDATE_NODE_POSITION', payload: { id: d.id, x: d.x, y: d.y } });
    }

    svg.on('click', (event) => {
      if (mode === 'add-node') {
        const [x, y] = d3.pointer(event);
        const label = String.fromCharCode(65 + topology.nodes.length);
        dispatch({ type: 'ADD_NODE', payload: { label, x, y } });
      } else if (mode === 'add-link') {
        setSourceNodeId(null);
      }
    });

  }, [topology, mode, sourceNodeId, dispatch, onNodeClick, onLinkClick]);

  useEffect(() => {
    const g = graphGroupRef.current;
    const svg = d3.select(svgRef.current);
    if (!svg || !g) return;
    if (overlayRef.current) {
      overlayRef.current.interrupt();
      overlayRef.current.remove();
      overlayRef.current = null;
    }

    const packet = state.simulation.activePacket;
    if (!packet || !packet.path || packet.path.length <= 1) return;

    const path = packet.path;
    const packetGroup = g.append('g').attr('class', 'packet');
    overlayRef.current = packetGroup;

    let transition = packetGroup.append('circle')
      .attr('r', 8)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    const startNode = topology.nodes.find(n => n.id === path[0]);
    if (startNode) {
      transition.attr('cx', startNode.x).attr('cy', startNode.y);
    }

    path.slice(1).forEach((nodeId, index) => {
      const targetNode = topology.nodes.find(n => n.id === nodeId);
      if (targetNode) {
        transition = transition.transition()
          .delay(index === 0 ? 0 : 500)
          .duration(1000)
          .ease(d3.easeLinear)
          .attr('cx', targetNode.x)
          .attr('cy', targetNode.y)
          .on('start', () => {
            dispatch({ type: 'SET_PACKET_STEP', payload: index });
          });
      }
    });

    transition.on('end', () => {
      const currentPacket = activePacketRef.current;
      const lastNodeId = path[path.length - 1];
      const lastNode = topology.nodes.find(n => n.id === lastNodeId);
      if (lastNode) {
        g.append('circle')
          .attr('cx', lastNode.x)
          .attr('cy', lastNode.y)
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 3)
          .attr('opacity', 1)
          .transition()
          .duration(600)
          .attr('r', 40)
          .attr('opacity', 0)
          .remove();
      }

      if (currentPacket?.loop) {
        const nextRunCount = currentPacket.runCount === -1 ? -1 : currentPacket.runCount - 1;
        if (nextRunCount === 0) {
          setTimeout(() => dispatch({ type: 'CLEAR_PACKET_ANIMATION' }), 600);
          return;
        }
        setTimeout(() => {
          const freshPacket = activePacketRef.current;
          if (freshPacket?.loop) {
            dispatch({
              type: 'START_PACKET_ANIMATION',
              payload: {
                ...freshPacket,
                currentStep: 0,
                runCount: nextRunCount,
                nonce: Date.now()
              }
            });
          }
        }, 200);
      } else {
        setTimeout(() => dispatch({ type: 'CLEAR_PACKET_ANIMATION' }), 600);
      }
    });
  }, [
    state.simulation.activePacket
      ? `${state.simulation.activePacket.path.join('>')}:${state.simulation.activePacket.loop}:${state.simulation.activePacket.runCount}:${state.simulation.activePacket.nonce ?? ''}`
      : '',
    topology,
    dispatch
  ]);

  return (
    <div className="w-full h-full bg-slate-50 border border-gray-200 rounded-lg overflow-hidden relative">
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
          </marker>
        </defs>
      </svg>
      {mode === 'add-link' && sourceNodeId && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-blue-200">
          Select target node
        </div>
      )}
    </div>
  );
};
