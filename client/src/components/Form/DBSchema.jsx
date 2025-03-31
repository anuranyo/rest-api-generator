import React, { useState, useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { TableNode } from "../nodes/TableNode";
import { RelationshipModal } from "../RelationshipModal";

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
        type: 'default',
        animated: false,
        markerEnd: rel.type === 'one-to-one' ? undefined : {
          type: 'arrowclosed',
          color: '#94a3b8',
        },
        label: rel.type,
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
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="one-to-many-marker"
              markerWidth="20"
              markerHeight="20"
              refX="5"
              refY="10"
              orient="auto"
            >
              <path d="M10,10 L0,5" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <path d="M10,10 L0,15" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <path d="M10,10 L5,10" stroke="#94a3b8" strokeWidth="2" fill="none" />
            </marker>
            <marker
              id="many-to-many-marker"
              markerWidth="20"
              markerHeight="20"
              refX="5"
              refY="10"
              orient="auto"
            >
              <path d="M10,10 L0,5" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <path d="M10,10 L0,15" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <path d="M10,10 L5,10" stroke="#94a3b8" strokeWidth="2" fill="none" />
            </marker>
          </defs>
        </svg>
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