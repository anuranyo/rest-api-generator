import React, { useState } from 'react';
import { Table } from './store';

interface RelationshipModalProps {
  sourceTables: Table[];
  targetTables: Table[];
  onClose: () => void;
  onCreateRelationship: (
    relationshipType: string, 
    sourceColumn: string, 
    targetColumn: string
  ) => void;
}

export function RelationshipModal({
  sourceTables,
  targetTables,
  onClose,
  onCreateRelationship
}: RelationshipModalProps) {
  const [relationshipType, setRelationshipType] = useState('one-to-many');
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetColumn, setTargetColumn] = useState('');

  const handleSubmit = () => {
    if (sourceColumn && targetColumn) {
      onCreateRelationship(relationshipType, sourceColumn, targetColumn);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Create Relationship</h2>
        
        <div className="mb-4">
          <label className="block mb-2">Relationship Type</label>
          <select 
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="one-to-many">One to Many</option>
            <option value="one-to-one">One to One</option>
            <option value="many-to-many">Many to Many</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Source Column</label>
          <select 
            value={sourceColumn}
            onChange={(e) => setSourceColumn(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Source Column</option>
            {sourceTables[0]?.columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.type})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Target Column</label>
          <select 
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Target Column</option>
            {targetTables[0]?.columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!sourceColumn || !targetColumn}
          >
            Create Relationship
          </button>
        </div>
      </div>
    </div>
  );
}