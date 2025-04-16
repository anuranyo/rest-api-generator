import React, { useState, useEffect } from "react";
import { Handle, Position } from "reactflow";
import { Trash2, Plus, Key, Link, Edit, Check, X } from "lucide-react";
import { useStore } from "../store";

// We'll use this to dynamically load Faker.js in the browser
const FAKER_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/Faker/3.1.0/faker.min.js";

export function TableNode({ data }) {
  const addColumn = useStore((s) => s.addColumn);
  const removeTable = useStore((s) => s.removeTable);
  const updateColumn = useStore((s) => s.updateColumn);
  const removeColumn = useStore((s) => s.removeColumn);
  const updateTableName = useStore((s) => s.updateTableName);
  const relationships = useStore((s) => s.relationships);
  
  // Get the entire table directly from the store
  const allTables = useStore((s) => s.tables);
  const actualTable = allTables.find(t => t.id === data.id);
  const columns = actualTable?.columns || data.columns || [];

  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [tableName, setTableName] = useState(data.name);
  const [fakerLoaded, setFakerLoaded] = useState(false);
  const [fakerStructure, setFakerStructure] = useState({});

  // For debugging
  useEffect(() => {
    console.log("TableNode ID:", data.id);
    console.log("TableNode data:", data);
    console.log("Actual table from store:", actualTable);
    console.log("Columns count:", columns.length);
  }, [data, actualTable, columns]);

  // Update the tableName when the data changes
  useEffect(() => {
    setTableName(data.name);
  }, [data.name]);

  // Load Faker.js from CDN
  useEffect(() => {
    if (!window.faker) {
      const script = document.createElement('script');
      script.src = FAKER_CDN_URL;
      script.async = true;
      script.onload = () => {
        setFakerLoaded(true);
        // Once loaded, extract the structure
        if (window.faker) {
          extractFakerStructure();
        }
      };
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else {
      setFakerLoaded(true);
      extractFakerStructure();
    }
  }, []);

  // Extract Faker.js structure (categories and methods)
  const extractFakerStructure = () => {
    if (!window.faker) return;
    
    const structure = {};
    
    Object.keys(window.faker).forEach(category => {
      // Skip non-object properties or internal ones
      if (typeof window.faker[category] !== 'object' || category.startsWith('_')) {
        return;
      }
      
      // Get all methods in this category
      const methods = Object.keys(window.faker[category]).filter(
        method => typeof window.faker[category][method] === 'function' && !method.startsWith('_')
      );
      
      if (methods.length > 0) {
        structure[category] = methods;
      }
    });
    
    setFakerStructure(structure);
  };

  const handleTableNameSubmit = () => {
    updateTableName(data.id, tableName);
    setIsEditingTableName(false);
  };

  const handleAddColumn = () => {
    // Generate a unique field name by appending a number if needed
    const baseFieldName = "field";
    let fieldNumber = 1;
    let newFieldName = baseFieldName;
    
    // Check if the field name already exists
    while (columns.some(col => col.name === newFieldName)) {
      newFieldName = `${baseFieldName}${fieldNumber}`;
      fieldNumber++;
    }
    
    addColumn(data.id, newFieldName, "name", "fullName");
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
    const column = columns.find(c => c.id === columnId);
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
    <div 
      className="bg-white border rounded shadow p-3 w-[240px]"
      style={{ height: 'auto', minHeight: '150px' }}
    >
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
            onClick={handleAddColumn}
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
      
      {/* Added max-height and overflow-y-auto to make columns scrollable */}
      <div className="space-y-1 text-sm">
        <div className="text-xs text-gray-400 mb-1">
          Columns: {columns.length}
        </div>
        
        <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1">
          {columns.map((col, index) => (
            <ColumnItem 
              key={`${col.id || index}`}
              column={col} 
              tableId={data.id}
              updateColumn={updateColumn}
              onDeleteColumn={handleDeleteColumn}
              isPrimaryKey={col.isPrimaryKey}
              fakerLoaded={fakerLoaded}
              fakerStructure={fakerStructure}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ColumnItem({ 
  column, 
  tableId, 
  updateColumn, 
  onDeleteColumn, 
  isPrimaryKey,
  fakerLoaded,
  fakerStructure,
  index
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [fakerCategory, setFakerCategory] = useState(column.fakerCategory || '');
  const [fakerType, setFakerType] = useState(column.fakerType || '');

  // Ensure we update local state when column props change
  useEffect(() => {
    setColumnName(column.name);
    setFakerCategory(column.fakerCategory || '');
    setFakerType(column.fakerType || '');
  }, [column]);

  // Get all available Faker categories
  const fakerCategories = Object.keys(fakerStructure).sort();

  // Get available methods for the selected category
  const fakerTypes = fakerCategory ? fakerStructure[fakerCategory] || [] : [];

  const handleSubmit = () => {
    updateColumn(tableId, column.id, { 
      name: columnName, 
      useFaker: true,
      fakerCategory: fakerCategory, 
      fakerType: fakerType
    });
    setIsEditing(false);
  };

  const handleCategoryChange = (category) => {
    setFakerCategory(category);
    // Reset faker type or set the first available type if exists
    if (fakerStructure[category] && fakerStructure[category].length > 0) {
      setFakerType(fakerStructure[category][0]);
    } else {
      setFakerType('');
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col bg-gray-50 p-1 rounded">
        <div className="flex space-x-2 mb-1">
          <input 
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="border rounded px-1 w-full"
            placeholder="Column name"
          />
        </div>
        <div className="flex space-x-2 mb-1">
          <select 
            value={fakerCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border rounded px-1 w-full"
            disabled={!fakerLoaded}
          >
            <option value="">Select Faker Category</option>
            {fakerCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2 mb-1">
          <select 
            value={fakerType}
            onChange={(e) => setFakerType(e.target.value)}
            className="border rounded px-1 w-full"
            disabled={!fakerCategory || !fakerLoaded}
          >
            <option value="">Select Faker Type</option>
            {fakerTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end items-center space-x-1 mt-1">
          <button 
            onClick={handleSubmit}
            className="text-green-600"
            disabled={!columnName || !fakerCategory || !fakerType}
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
    <div className="flex justify-between items-center p-1 rounded hover:bg-gray-50">
      <span className="truncate max-w-[150px]">
        {index + 1}. {column.name} 
        {column.useFaker && column.fakerCategory && (
          <span className="text-gray-400">
            ({column.fakerCategory}.{column.fakerType})
          </span>
        )}
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