import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { TableNode } from "../nodes/TableNode";
import { RelationshipModal } from "../RelationshipModal";
import { CreateTableModel } from "../Form/CreateTableModel";
import { EditRelationshipModal } from '../Form/EditRelationshipModal';
import { motion, AnimatePresence } from 'framer-motion';

const nodeTypes = { table: TableNode };

// Inner component that uses React Flow hooks
function DBSchemaFlow() {
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState({
    source: null,
    sourceHandle: null,
    target: null,
    targetHandle: null
  });

  // New state for controlling the Create Table modal and error message
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false);
  const [tableNameError, setTableNameError] = useState(null);

  // State for selected relationship to edit
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  
  // Reference to the reactflow viewport
  const reactFlowWrapper = useRef(null);

  const tables = useStore((state) => state.tables);
  const addTable = useStore((state) => state.addTable);
  const addRelationship = useStore((state) => state.addRelationship);
  const edgesFromStore = useStore((state) => state.relationships);
  const updateRelationship = useStore((s) => s.updateRelationship);
  const deleteRelationship = useStore((s) => s.deleteRelationship);
  const updateTablePosition = useStore((s) => s.updateTablePosition);

  // Modified to preserve existing positions
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

  const edgesFromRelations = useMemo(
    () =>
      edgesFromStore.map((rel) => {
        const sourceHandleId = rel.sourceHandleId || `${rel.sourceTableId}-right-source`;
        const targetHandleId = rel.targetHandleId || `${rel.targetTableId}-left-target`;

        let displayType = rel.type;

        let markerStart, markerEnd;

        if (rel.type === 'one-to-many') {
          markerStart = 'one';
          markerEnd = 'many';
        } else if (rel.type === 'many-to-one') {
          markerStart = 'many';
          markerEnd = 'one';
        } else if (rel.type === 'one-to-one') {
          markerStart = 'one';
          markerEnd = 'one';
        } else if (rel.type === 'many-to-many') {
          markerStart = 'many';
          markerEnd = 'many';
        }

        return {
          id: rel.id,
          source: rel.sourceTableId,
          sourceHandle: sourceHandleId,
          target: rel.targetTableId,
          targetHandle: targetHandleId,
          type: 'custom',
          animated: false,
          data: {
            markerStart,
            markerEnd,
            type: displayType
          },
          label: displayType,
          style: {
            stroke: "#94a3b8",
            strokeWidth: 2,
          },
        };
      }),
    [edgesFromStore]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesFromTables);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesFromRelations);

  // Use ref to track if initial render has happened
  const initialRenderDone = useRef(false);

  useEffect(() => {
    // Only update nodes initially or when tables length changes (new table added)
    if (!initialRenderDone.current || tables.length !== nodes.length) {
      setNodes(nodesFromTables);
      initialRenderDone.current = true;
    }
  }, [tables, nodesFromTables, setNodes, nodes.length]);

  useEffect(() => {
    setEdges(edgesFromRelations);
  }, [edgesFromStore, setEdges]);

  // Handle node position changes 
  const onNodeDragStop = useCallback((event, node) => {
    // Update the position in the store
    updateTablePosition(node.id, node.position);
  }, [updateTablePosition]);

  const onConnect = useCallback(
    (connection) => {
      setPendingConnection({
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle
      });
      setIsRelationshipModalOpen(true);
    },
    []
  );

  const handleCreateRelationship = useCallback(
    (relationshipType, sourceColumn, targetColumn, sourceCardinality, targetCardinality) => {
      if (pendingConnection.source && pendingConnection.target) {
        addRelationship({
          sourceTableId: pendingConnection.source,
          sourceHandleId: pendingConnection.sourceHandle,
          targetTableId: pendingConnection.target,
          targetHandleId: pendingConnection.targetHandle,
          sourceColumnId: sourceColumn,
          targetColumnId: targetColumn,
          sourceCardinality: sourceCardinality,
          targetCardinality: targetCardinality,
          type: relationshipType
        });

        setIsRelationshipModalOpen(false);
        setPendingConnection({ source: null, sourceHandle: null, target: null, targetHandle: null });
      }
    },
    [pendingConnection, addRelationship]
  );

  // Function to handle table creation with center positioning
  const handleCreateTable = (tableName) => {
    setTableNameError(null); // Reset the error message

    const existingTable = tables.find((table) => table.name.toLowerCase() === tableName.trim().toLowerCase());
    if (existingTable) {
      setTableNameError('Table with this name already exists.');
      return;
    }

    // Instead of using ReactFlow viewport, calculate position based on container size
    // since we don't have access to the getViewport function
    const flowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const centerX = flowBounds.width / 2 - 120; // Subtracting half of the table width
    const centerY = flowBounds.height / 2 - 100; // Subtracting half of the table height

    const position = {
      x: centerX,
      y: centerY,
    };

    const newTableId = uuidv4();
    addTable(tableName.trim(), position, newTableId);
    setIsCreateTableModalOpen(false); // Close the modal after successful creation
  };

  const handleUpdateRelationship = (updatedRelationship) => {
    updateRelationship(updatedRelationship.id, {
      type: updatedRelationship.type,
      sourceCardinality: updatedRelationship.sourceCardinality,
      targetCardinality: updatedRelationship.targetCardinality,
    });
    setSelectedRelationship(null);
  };
  
  const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data, label }) => {
    const onEdgeClick = (event) => {
      event.stopPropagation(); // Prevents click on the background
      setSelectedRelationship(edgesFromStore.find(edge => edge.id === id) || null);
    };

    const dx = Math.abs(targetX - sourceX);
    const dy = Math.abs(targetY - sourceY);

    const curvature = 0.5;

    const controlPointX1 = sourceX + dx * curvature;
    const controlPointY1 = sourceY;
    const controlPointX2 = targetX - dx * curvature;
    const controlPointY2 = targetY;

    const edgePath = `M ${sourceX} ${sourceY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${targetX} ${targetY}`;

    return (
      <>
        {/* Clickable Hitbox */}
        <path
          id={`hitbox-${id}`}
          className="react-flow__edge-path"
          d={edgePath}
          stroke="transparent"
          strokeWidth={10} // Increased stroke width for wider clickable area
          onClick={onEdgeClick}
          style={{ pointerEvents: 'stroke' }} // only the stroke should trigger the click
        />

        {/* Visual Line */}
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={data?.markerEnd ? `url(#marker-${data.markerEnd})` : undefined}
          markerStart={data?.markerStart ? `url(#marker-${data.markerStart})` : undefined}
          strokeWidth={4}  // Increased stroke width for thicker lines
          stroke="#94a3b8"
          style={{ pointerEvents: 'none' }} // the visual line should not trigger the click
        />
        {label && (
            <text onClick={onEdgeClick} style={{ cursor: 'pointer' }}> {/* Add onClick and style */}
                <textPath
                    href={`#${id}`}
                    style={{ fontSize: '12px' }}
                    startOffset="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#555"
                >
                    {label}
                </textPath>
            </text>
        )}
      </>
    );
  };

  const edgeTypes = {
    custom: CustomEdge,
  };

  const handleDeleteRelationship = (relationshipId) => {
    deleteRelationship(relationshipId);
    setSelectedRelationship(null);
  };
  
  return (
    <div className="w-full h-full min-w-[600px] rounded-xl overflow-hidden border relative bg-white" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode="loose"
      >
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="marker-one"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <path d="M 0 5 L 10 5" stroke="#94a3b8" strokeWidth="2" fill="none" />
            </marker>

            <marker
              id="marker-many"
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="15"
              markerHeight="15"
              orient="auto"
            >
              <path d="M 1 0 L 5 5 L 1 10 M 5 0 L 9 5 L 5 10" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
            </marker>
          </defs>
        </svg>
        <Background gap={16} color="#f3f4f6" />
        <MiniMap zoomable pannable />
        <Controls position="top-right" />
      </ReactFlow>

      {/* Button to open the Create Table modal */}
      <button
        onClick={() => setIsCreateTableModalOpen(true)}
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

      {/* Render the Create Table modal using AnimatePresence for transitions */}
      <AnimatePresence>
        {isCreateTableModalOpen && (
          <CreateTableModel
            onClose={() => setIsCreateTableModalOpen(false)}
            onCreateTable={handleCreateTable}
            errorMessage={tableNameError}
            key="createTableModal" // Add a key for proper animation
          />
        )}
      </AnimatePresence>
      {/* Render the Edit Relationship modal */}
      <AnimatePresence>
        {selectedRelationship && (
          <EditRelationshipModal
            relationship={selectedRelationship}
            sourceTable={tables.find(table => table.id === selectedRelationship.sourceTableId)}
            targetTable={tables.find(table => table.id === selectedRelationship.targetTableId)}
            onClose={() => setSelectedRelationship(null)}
            onUpdateRelationship={handleUpdateRelationship}
            onDeleteRelationship={handleDeleteRelationship} // Pass the delete handler
            key={selectedRelationship.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Main export component wrapped with ReactFlowProvider
export default function DBSchema() {
  return (
    <ReactFlowProvider>
      <DBSchemaFlow />
    </ReactFlowProvider>
  );
}