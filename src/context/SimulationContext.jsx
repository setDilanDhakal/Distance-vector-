import React, { createContext, useContext, useReducer } from 'react';
import { initializeNodeState, runDistanceVectorStep } from '../utils/algorithm.js';

const getInitialSimulationState = (topology) => {
  const initialNodeStates = {};
  topology.nodes.forEach(node => {
    initialNodeStates[node.id] = initializeNodeState(node.id, topology);
  });
  return {
    step: 0,
    isRunning: false,
    nodeStates: initialNodeStates,
    history: { 0: initialNodeStates },
    messages: [{ id: 'init', from: 'System', to: 'All', content: 'Simulation Initialized', type: 'info' }],
    activePacket: null
  };
};

const initialState = {
  topology: {
    nodes: [],
    links: [],
  },
  simulation: {
    step: 0,
    isRunning: false,
    nodeStates: {},
    history: {},
    messages: [],
    activePacket: null,
  },
};

const SimulationContext = createContext(undefined);

const simulationReducer = (state, action) => {
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
    case 'SET_PACKET_STEP':
      if (!state.simulation.activePacket) return state;
      return {
        ...state,
        simulation: {
          ...state.simulation,
          activePacket: {
            ...state.simulation.activePacket,
            currentStep: action.payload
          }
        }
      };
    case 'ADD_NODE': {

      const newNode = { id: crypto.randomUUID(), label: action.payload.label, x: action.payload.x, y: action.payload.y };
      const topologyWithNode = {
        ...state.topology,
        nodes: [...state.topology.nodes, newNode],
      };
      return {
        ...state,
        topology: topologyWithNode,
        simulation: getInitialSimulationState(topologyWithNode),
      };
    }
    case 'UPDATE_NODE_POSITION':
      return {
        ...state,
        topology: {
          ...state.topology,
          nodes: state.topology.nodes.map(n => n.id === action.payload.id ? { ...n, x: action.payload.x, y: action.payload.y } : n)
        }
      };
    case 'ADD_LINK': {
      const newLink = { id: crypto.randomUUID(), source: action.payload.source, target: action.payload.target, cost: action.payload.cost };
      const topologyWithLink = {
        ...state.topology,
        links: [...state.topology.links, newLink],
      };
      return {
        ...state,
        topology: topologyWithLink,
        simulation: getInitialSimulationState(topologyWithLink),
      };
    }
    case 'UPDATE_LINK_COST': {
      const topologyWithUpdatedLink = {
        ...state.topology,
        links: state.topology.links.map(l => l.id === action.payload.id ? { ...l, cost: action.payload.cost } : l)
      };
      return {
        ...state,
        topology: topologyWithUpdatedLink,
        simulation: getInitialSimulationState(topologyWithUpdatedLink),
      };
    }
    case 'DELETE_NODE': {
      const topologyWithoutNode = {
        nodes: state.topology.nodes.filter(n => n.id !== action.payload),
        links: state.topology.links.filter(l => l.source !== action.payload && l.target !== action.payload)
      };
      return {
        ...state,
        topology: topologyWithoutNode,
        simulation: getInitialSimulationState(topologyWithoutNode),
      };
    }
    case 'DELETE_LINK': {
      const topologyWithoutLink = {
        ...state.topology,
        links: state.topology.links.filter(l => l.id !== action.payload)
      };
      return {
        ...state,
        topology: topologyWithoutLink,
        simulation: getInitialSimulationState(topologyWithoutLink),
      };
    }
    case 'RESET_SIMULATION':
      return {
        ...state,
        simulation: getInitialSimulationState(state.topology),
      };
    case 'STEP_SIMULATION': {
      if (Object.keys(state.simulation.nodeStates).length === 0) {
        const initStates = {};
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
        state.simulation.nodeStates
      );

      const nextStep = state.simulation.step + 1;
      const newMessages = messages.map((msg, idx) => ({
        id: `${nextStep}-${idx}`,
        from: 'System',
        to: 'All',
        content: msg,
        type: 'update'
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
    }
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
        simulation: { ...initialState.simulation }
      };
    case 'HYDRATE_NODE_STATES': {
      const hydratedStates = action.payload.nodeStates;
      const nextStep = state.simulation.step + 1;
      return {
        ...state,
        simulation: {
          ...state.simulation,
          step: nextStep,
          nodeStates: hydratedStates,
          history: { ...state.simulation.history, [nextStep]: hydratedStates },
          messages: [
            ...state.simulation.messages,
            { id: `hydrate-${nextStep}`, from: 'System', to: 'All', content: 'Routes hydrated for packet send', type: 'info' }
          ],
        },
      };
    }
    default:
      return state;
  }
};

export const SimulationProvider = ({ children }) => {
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
