import React, { useState } from 'react';
import { TopologyEditor } from '../components/network/TopologyEditor';
import { RoutingTableList } from '../components/tables/RoutingTableList';
import { GlobalRoutingTable } from '../components/tables/GlobalRoutingTable';
import { SimulationControls } from '../components/controls/SimulationControls';
import { EducationalPanel } from '../components/ui/EducationalPanel';
import { Network, Github, BookOpen, LayoutList, Table2, Maximize2, Minimize2 } from 'lucide-react';

export const SimulationPage = () => {
  const [tableView, setTableView] = useState<'list' | 'matrix'>('list');
  const [tablesFullscreen, setTablesFullscreen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Controls */}
      <div className="flex-none z-10 shadow-sm bg-white overflow-x-auto">
          <SimulationControls />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left/Top Column: Topology & Graph */}
        <div className="flex-1 relative flex flex-col min-h-[50vh] lg:min-h-0 bg-slate-50">
            <div className="absolute inset-0 p-4 overflow-auto">
                <TopologyEditor />
            </div>
        </div>

        {/* Right/Bottom Column: Tables & Info */}
        <div className="flex-none w-full lg:w-[450px] flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 bg-white shadow-xl z-10 h-[50vh] lg:h-auto overflow-hidden">
            {/* Top Right: Routing Tables */}
            <div className="flex-1 lg:h-1/2 flex flex-col border-b border-gray-200 min-h-0">
                <div className="p-3 bg-gray-50 border-b font-semibold text-gray-700 flex justify-between items-center flex-none">
                    <div className="flex items-center gap-2">
                        <span>Routing Tables</span>
                        <div className="flex bg-white rounded-md border border-gray-200 p-0.5 ml-2">
                            <button 
                                onClick={() => setTableView('list')}
                                className={`p-1 rounded ${tableView === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="List View"
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setTableView('matrix')}
                                className={`p-1 rounded ${tableView === 'matrix' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Matrix View"
                            >
                                <Table2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setTablesFullscreen(true)}
                                className="px-2 py-1 rounded text-gray-700 hover:bg-gray-100 border border-gray-200 ml-1 flex items-center gap-1"
                                title="Full Screen"
                            >
                                <Maximize2 className="w-4 h-4" />
                                <span className="text-xs">Full Screen</span>
                            </button>
                        </div>
                    </div>
                    <span className="text-xs font-normal text-gray-500">Live Updates</span>
                </div>
                <div className="flex-1 overflow-y-auto relative bg-slate-100">
                    {tableView === 'list' ? <RoutingTableList /> : <GlobalRoutingTable />}
                </div>
            </div>

            {/* Bottom Right: Education Panel */}
            <div className="flex-1 lg:h-1/2 flex flex-col bg-gray-50 min-h-0">
                <div className="flex-1 overflow-hidden p-2 flex flex-col">
                     <div className="flex-1 min-h-0 overflow-y-auto relative rounded border border-gray-200 bg-white">
                        <EducationalPanel />
                     </div>
                </div>
            </div>
        </div>
      </div>
      
      {tablesFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="p-3 bg-gray-50 border-b font-semibold text-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span>Routing Tables</span>
                    <div className="flex bg-white rounded-md border border-gray-200 p-0.5 ml-2">
                        <button 
                            onClick={() => setTableView('list')}
                            className={`p-1 rounded ${tableView === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setTableView('matrix')}
                            className={`p-1 rounded ${tableView === 'matrix' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Matrix View"
                        >
                            <Table2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setTablesFullscreen(false)}
                    className="px-2 py-1 rounded text-gray-700 hover:bg-gray-100 border border-gray-200 flex items-center gap-1"
                    title="Exit Full Screen"
                >
                    <Minimize2 className="w-4 h-4" />
                    <span className="text-xs">Exit</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-100">
                {tableView === 'list' ? <RoutingTableList /> : <GlobalRoutingTable />}
            </div>
        </div>
      )}
    </div>
  );
};
