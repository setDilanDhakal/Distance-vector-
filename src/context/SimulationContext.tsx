import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { NetworkTopology, Node, Link, SimulationState, AlgorithmType, NodeState } from '../types/network';
import { createNode, createLink } from '../utils/graphUtils';
import { initializeNodeState, runDistanceVectorStep } from '../utils/algorithm';

interface State {
  topology: NetworkTopology;
  simulation: SimulationState;
}

type Action =
  | { type: 'ADD_NODE'; payload: { label: string; x: number; y: number } }
  | { type: 'UPDATE_NODE_POSITION'; payload: { id: string; x: number; y: number } }
  | { type: 'ADD_LINK'; payload: { source: string; target: string; cost: number } }
  | { type: 'UPDATE_LINK_COST'; payload: { id: string; cost: number } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'DELETE_LINK'; payload: string }
  | { type: 'SET_ALGORITHM'; payload: AlgorithmType }
  | { type: 'RESET_SIMULATION' }
  | { type: 'STEP_SIMULATION' }
  | { type: 'TOGGLE_AUTO_RUN'; payload: boolean }
  | { type: 'LOAD_TOPOLOGY'; payload: NetworkTopology }
  | { type: 'START_PACKET_ANIMATION'; payload: { path: string[]; currentStep: number; loop: boolean; runCount: number } | null }
  | { type: 'CLEAR_PACKET_ANIMATION' };

const getInitialSimulationState = (topology: NetworkTopology, algorithm: AlgorithmType): SimulationState => {
    const initialNodeStates: { [id: string]: NodeState } = {};
    topology.nodes.forEach(node => {
        initialNodeStates[node.id] = initializeNodeState(node.id, topology);
    });
    return {
        step: 0,
        isRunning: false,
        algorithm: algorithm,
        nodeStates: initialNodeStates,
        history: { 0: initialNodeStates },
        messages: [{ id: 'init', from: 'System', to: 'All', content: 'Simulation Initialized', type: 'info' }],
        activePacket: null
    };
}

const initialState: State = {
  topology: {
    nodes: [],
    links: [],
  },
  simulation: {
    step: 0,
    isRunning: false,
    algorithm: 'basic',
    nodeStates: {},
    history: {},
    messages: [],
    activePacket: null,
  },
};

const SimulationContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const simulationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_PACKET_ANIMATION':
        return {
            ...state,
            simulation: {
                ...state.simulation,
                activePacket: action.payload
            }
        };
    case 'CLEAR_PACKET_ANIMATION':
        return {
            ...state,
            simulation: {
                ...state.simulation,
                activePacket: null
            }
        };
    case 'ADD_NODE':
      const newNode = createNode(action.payload.label, action.payload.x, action.payload.y);
      const topologyWithNode = {
          ...state.topology,
          nodes: [...state.topology.nodes, newNode],
      };
      return {
        ...state,
        topology: topologyWithNode,
        // Reset simulation when topology changes
        simulation: getInitialSimulationState(topologyWithNode, state.simulation.algorithm),
      };
    case 'UPDATE_NODE_POSITION':
        // No need to reset simulation for position change, but maybe good to keep it consistent?
        // Actually position doesn't affect routing, so we can keep simulation state.
        return {
            ...state,
            topology: {
                ...state.topology,
                nodes: state.topology.nodes.map(n => n.id === action.payload.id ? { ...n, x: action.payload.x, y: action.payload.y } : n)
            }
        };
    case 'ADD_LINK':
      const newLink = createLink(action.payload.source, action.payload.target, action.payload.cost);
      const topologyWithLink = {
          ...state.topology,
          links: [...state.topology.links, newLink],
      };
      return {
        ...state,
        topology: topologyWithLink,
        simulation: getInitialSimulationState(topologyWithLink, state.simulation.algorithm),
      };
    case 'UPDATE_LINK_COST':
        const topologyWithUpdatedLink = {
            ...state.topology,
            links: state.topology.links.map(l => l.id === action.payload.id ? { ...l, cost: action.payload.cost } : l)
        };
        return {
            ...state,
            topology: topologyWithUpdatedLink,
            simulation: getInitialSimulationState(topologyWithUpdatedLink, state.simulation.algorithm),
        }
    case 'DELETE_NODE':
        const topologyWithoutNode = {
            nodes: state.topology.nodes.filter(n => n.id !== action.payload),
            links: state.topology.links.filter(l => l.source !== action.payload && l.target !== action.payload)
        };
        return {
            ...state,
            topology: topologyWithoutNode,
            simulation: getInitialSimulationState(topologyWithoutNode, state.simulation.algorithm),
        }
    case 'DELETE_LINK':
        const topologyWithoutLink = {
            ...state.topology,
            links: state.topology.links.filter(l => l.id !== action.payload)
        };
        return {
            ...state,
            topology: topologyWithoutLink,
            simulation: getInitialSimulationState(topologyWithoutLink, state.simulation.algorithm),
        }
    case 'SET_ALGORITHM':
      return {
        ...state,
        simulation: getInitialSimulationState(state.topology, action.payload),
      };
    case 'RESET_SIMULATION':
      // Re-initialize node states based on current topology
      return {
        ...state,
        simulation: getInitialSimulationState(state.topology, state.simulation.algorithm),
      };
    case 'STEP_SIMULATION':
      if (Object.keys(state.simulation.nodeStates).length === 0) {
          // Auto-initialize if empty
          const initStates: { [id: string]: NodeState } = {};
          state.topology.nodes.forEach(node => {
              initStates[node.id] = initializeNodeState(node.id, state.topology);
          });
          return {
              ...state,
              simulation: {
                  ...state.simulation,
                  step: 0,
                  nodeStates: initStates,
                  history: { 0: initStates },
                  messages: [...state.simulation.messages, { id: `init-step`, from: 'System', to: 'All', content: 'Auto-initialized before step', type: 'info' }]
              }
          };
      }

      const { nextStates, messages } = runDistanceVectorStep(
          state.topology,
          state.simulation.nodeStates,
          state.simulation.algorithm
      );
      
      const nextStep = state.simulation.step + 1;
      const newMessages = messages.map((msg, idx) => ({
          id: `${nextStep}-${idx}`,
          from: 'System',
          to: 'All',
          content: msg,
          type: 'update' as const
      }));

      return {
        ...state,
        simulation: {
          ...state.simulation,
          step: nextStep,
          nodeStates: nextStates,
          history: { ...state.simulation.history, [nextStep]: nextStates },
          messages: [...state.simulation.messages, ...newMessages],
        },
      };
    case 'TOGGLE_AUTO_RUN':
        return {
            ...state,
            simulation: {
                ...state.simulation,
                isRunning: action.payload
            }
        };
    case 'LOAD_TOPOLOGY':
        return {
            ...state,
            topology: action.payload,
            simulation: { ...initialState.simulation, algorithm: state.simulation.algorithm }
        };
    default:
      return state;
  }
};

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  return (
    <SimulationContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
