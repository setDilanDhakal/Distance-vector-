export interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface Link {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  cost: number;
}

export interface RouteEntry {
  destination: string; // Node ID
  cost: number;
  nextHop: string | null; // Node ID or null if direct or self
  changed?: boolean; // For highlighting updates
}

export interface RoutingTable {
  [destinationId: string]: RouteEntry;
}

export interface NodeState {
  id: string; // Node ID
  routingTable: RoutingTable;
  neighbors: string[]; // List of neighbor Node IDs
}

export interface NetworkTopology {
  nodes: Node[];
  links: Link[];
}

export type AlgorithmType = 'basic' | 'split-horizon' | 'poisoned-reverse';

export interface SimulationState {
  step: number;
  isRunning: boolean;
  algorithm: AlgorithmType;
  nodeStates: { [nodeId: string]: NodeState };
  history: { [step: number]: { [nodeId: string]: NodeState } }; // For step-back functionality
  messages: SimulationMessage[]; // Log of what happened in this step
  activePacket?: { path: string[]; currentStep: number; loop: boolean; runCount: number } | null;
}

export interface SimulationMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'update' | 'info' | 'error';
}
