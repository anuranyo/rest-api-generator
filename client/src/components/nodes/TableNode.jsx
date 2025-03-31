import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { Trash2, Plus, Key, Link, Edit, Check, X } from "lucide-react";
import { useStore } from "../store";

export function TableNode({ data }) {
  const addColumn = useStore((s) => s.addColumn);
  const removeTable = useStore((s) => s.removeTable);
  const updateColumn = useStore((s) => s.updateColumn);
  const removeColumn = useStore((s) => s.removeColumn);
  const updateTableName = useStore((s) => s.updateTableName);
  const relationships = useStore((s) => s.relationships);

  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [tableName, setTableName] = useState(data.name);

  const handleTableNameSubmit = () => {
    updateTableName(data.id, tableName);
    setIsEditingTableName(false);
  };

  const handleDeleteColumn = (columnId) => {
    // Check if column is involved in any relationships
    const isColumnInRelationship = relationships.some(
      rel => 
        (rel.sourceTableId === data.id && rel.sourceColumnId === columnId) ||
        (rel.targetTableId === data.id && rel.targetColumnId === columnId)
    );

    if (isColumnInRelationship) {
      const confirmDelete = window.confirm(
        "This column is involved in a relationship. Deleting it will remove the relationship. Continue?"
      );
      
      if (!confirmDelete) return;
    }

    // Prevent deleting the primary key (default 'id' column)
    const column = data.columns.find(c => c.id === columnId);
    if (column?.isPrimaryKey) {
      alert("Cannot delete the primary key column.");
      return;
    }

    removeColumn(data.id, columnId);
  };

  // Create handles on all sides
  const handleStyle = { 
    width: 8, 
    height: 8, 
    backgroundColor: '#778899'
  };

  return (
    <div className="bg-white border rounded shadow p-3 w-[240px]">
      {/* Top handles */}
      <Handle 
        type="source" 
        position={Position.Top} 
        id={`${data.id}-top-source`} 
        style={{...handleStyle, left: '25%'}} 
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id={`${data.id}-top-target`} 
        style={{...handleStyle, left: '75%'}}
      />
      
      {/* Left handles */}
      <Handle 
        type="source" 
        position={Position.Left} 
        id={`${data.id}-left-source`}
        style={{...handleStyle, top: '25%'}}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id={`${data.id}-left-target`}
        style={{...handleStyle, top: '75%'}}
      />
      
      {/* Right handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id={`${data.id}-right-source`}
        style={{...handleStyle, top: '25%'}}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id={`${data.id}-right-target`}
        style={{...handleStyle, top: '75%'}}
      />
      
      {/* Bottom handles */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id={`${data.id}-bottom-source`}
        style={{...handleStyle, left: '25%'}}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id={`${data.id}-bottom-target`}
        style={{...handleStyle, left: '75%'}}
      />

      <div className="flex justify-between items-center mb-2">
        {isEditingTableName ? (
          <div className="flex items-center">
            <input 
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="border rounded px-2 py-1 mr-2"
            />
            <button 
              onClick={handleTableNameSubmit}
              className="text-green-600 mr-1"
            >
              <Check size={14} />
            </button>
            <button 
              onClick={() => setIsEditingTableName(false)}
              className="text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="font-bold flex items-center">
            {data.name}
            <button 
              onClick={() => setIsEditingTableName(true)}
              className="ml-2 text-gray-500"
            >
              <Edit size={12} />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            className="text-blue-600"
            onClick={() => addColumn(data.id, "field", "string")}
          >
            <Plus size={14} />
          </button>
          <button
            className="text-red-600"
            onClick={() => removeTable(data.id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        {data.columns.map((col) => (
          <ColumnItem 
            key={col.id} 
            column={col} 
            tableId={data.id}
            updateColumn={updateColumn}
            onDeleteColumn={handleDeleteColumn}
            isPrimaryKey={col.isPrimaryKey}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnItem({ 
  column, 
  tableId, 
  updateColumn, 
  onDeleteColumn, 
  isPrimaryKey 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [columnType, setColumnType] = useState(column.type);

  const handleSubmit = () => {
    updateColumn(tableId, column.id, { 
      name: columnName, 
      type: columnType 
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex justify-between items-center bg-gray-50 p-1 rounded">
        <div className="flex space-x-2">
          <input 
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="border rounded px-1 w-24"
            placeholder="Column name"
          />
          <select 
            value={columnType}
            onChange={(e) => setColumnType(e.target.value)}
            className="border rounded px-1"
          >
            <option value="string">String</option>
            <option value="integer">Integer</option>
            <option value="boolean">Boolean</option>
            <option value="float">Float</option>
            <option value="date">Date</option>
          </select>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={handleSubmit}
            className="text-green-600"
          >
            <Check size={14} />
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <span>
        {column.name} <span className="text-gray-400">({column.type})</span>
      </span>
      <div className="flex gap-2 items-center">
        {column.isPrimaryKey && <Key size={12} className="text-yellow-500" />}
        {column.isForeignKey && <Link size={12} className="text-blue-500" />}
        <button 
          onClick={() => setIsEditing(true)}
          className="text-gray-500"
        >
          <Edit size={12} />
        </button>
        {!isPrimaryKey && (
          <button 
            onClick={() => onDeleteColumn(column.id)}
            className="text-red-500"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}