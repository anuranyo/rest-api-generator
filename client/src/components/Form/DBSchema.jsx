import React, { useState, useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { TableNode } from "../nodes/TableNode";
import { RelationshipModal } from "../RelationshipModal";

// Custom Marker Component with Improved Rendering
const CustomMarker = React.forwardRef(({ type, color = '#94a3b8' }, ref) => {
  switch(type) {
    case 'one-to-one':
      return (
        <marker 
          ref={ref}
          id={`${type}-marker`}
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="5"
          orient="auto"
        >
          <line x1="0" y1="5" x2="10" y2="5" stroke={color} strokeWidth="2" />
        </marker>
      );
    case 'one-to-many':
      return (
        <marker 
          ref={ref}
          id={`${type}-marker`}
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="5"
          orient="auto"
        >
          <path 
            d="M0,0 L10,5 L0,10" 
            stroke={color} 
            fill="none" 
            strokeWidth="2" 
          />
        </marker>
      );
    case 'many-to-many':
      return (
        <marker 
          ref={ref}
          id={`${type}-marker`}
          markerWidth="15" 
          markerHeight="10" 
          refX="7" 
          refY="5"
          orient="auto"
        >
          <path 
            d="M0,5 L7,0 L14,5 L7,10 Z" 
            stroke={color} 
            fill="none" 
            strokeWidth="2" 
          />
        </marker>
      );
    default:
      return null;
  }
});

const nodeTypes = { table: TableNode };

export default function DBSchema() {
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState({ 
    source: null, 
    target: null 
  });

  const tables = useStore((state) => state.tables);
  const addTable = useStore((state) => state.addTable);
  const addRelationship = useStore((state) => state.addRelationship);
  const edgesFromStore = useStore((state) => state.relationships);

  // Create nodes from tables
  const nodesFromTables = useMemo(
    () =>
      tables.map((table) => ({
        id: table.id,
        type: "table",
        position: table.position || { x: 100, y: 100 },
        data: table,
      })),
    [tables]
  );

  // Create edges from relationships with custom markers
  const edgesFromRelations = useMemo(
    () =>
      edgesFromStore.map((rel) => ({
        id: rel.id,
        source: rel.sourceTableId,
        target: rel.targetTableId,
        type: 'step',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94a3b8',
          width: 20,
          height: 20,
        },
        label: rel.type, // Add this to help debug
        style: { 
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
      })),
    [edgesFromStore]
  );

  // Use the memoized nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(nodesFromTables);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesFromRelations);

  // Update nodes when tables change
  useEffect(() => {
    setNodes(nodesFromTables);
  }, [tables, setNodes]);

  // Update edges when relationships change
  useEffect(() => {
    setEdges(edgesFromRelations);
  }, [edgesFromStore, setEdges]);

  const onConnect = useCallback(
    (connection) => {
      // Open relationship modal when connection is initiated
      setPendingConnection({
        source: connection.source,
        target: connection.target,
      });
      setIsRelationshipModalOpen(true);
    },
    []
  );

  const handleCreateRelationship = useCallback(
    (relationshipType, sourceColumn, targetColumn) => {
      if (pendingConnection.source && pendingConnection.target) {
        addRelationship({
          sourceTableId: pendingConnection.source,
          targetTableId: pendingConnection.target,
          sourceColumnId: sourceColumn,
          targetColumnId: targetColumn,
          type: relationshipType
        });
        
        setIsRelationshipModalOpen(false);
        setPendingConnection({ source: null, target: null });
      }
    },
    [pendingConnection, addRelationship]
  );

  const handleAddTable = () => {
    const name = prompt("Enter table name:");
    if (!name) return;
    
    const position = {
      x: Math.floor(Math.random() * 500 + 100),
      y: Math.floor(Math.random() * 400 + 100),
    };
    
    const newTableId = uuidv4();
    addTable(name.trim(), position, newTableId);
  };

  return (
    <div className="w-full h-full min-w-[600px] rounded-xl overflow-hidden border relative bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background gap={16} color="#f3f4f6" />
        <MiniMap zoomable pannable />
        <Controls position="top-right" />
      </ReactFlow>

      <button
        onClick={handleAddTable}
        className="absolute bottom-4 left-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
      >
        + Add Table
      </button>

      {isRelationshipModalOpen && (
        <RelationshipModal
          sourceTables={tables.filter(t => t.id === pendingConnection.source)}
          targetTables={tables.filter(t => t.id === pendingConnection.target)}
          onClose={() => setIsRelationshipModalOpen(false)}
          onCreateRelationship={handleCreateRelationship}
        />
      )}
    </div>
  );
}