import React, { useState } from 'react';
import { Table } from './store';

interface RelationshipModalProps {
  sourceTables: Table[];
  targetTables: Table[];
  onClose: () => void;
  onCreateRelationship: (
    relationshipType: string, 
    sourceColumn: string,
    targetColumn: string,
    sourceCardinality: string,
    targetCardinality: string
  ) => void;
}

export function RelationshipModal({
  sourceTables,
  targetTables,
  onClose,
  onCreateRelationship
}: RelationshipModalProps) {
  const [sourceCardinality, setSourceCardinality] = useState('one');
  const [targetCardinality, setTargetCardinality] = useState('many');
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetColumn, setTargetColumn] = useState('');

  // Determine relationship type based on cardinality selections
  const getRelationshipType = () => {
    if (sourceCardinality === 'one' && targetCardinality === 'one') {
      return 'one-to-one';
    } else if (sourceCardinality === 'many' && targetCardinality === 'many') {
      return 'many-to-many';
    } else if (sourceCardinality === 'one' && targetCardinality === 'many') {
      return 'one-to-many';
    } else {
      return 'many-to-one'; // New type we'll handle in the UI
    }
  };

  const handleSubmit = () => {
    if (sourceColumn && targetColumn) {
      const relationshipType = getRelationshipType();
      onCreateRelationship(
        relationshipType, 
        sourceColumn, 
        targetColumn,
        sourceCardinality,
        targetCardinality
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Create Relationship</h2>

        <div className="mb-4">
          <label className="block mb-2">Source Table: {sourceTables[0]?.name}</label>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm">Cardinality:</label>
            <div className="flex border rounded overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1 ${sourceCardinality === 'one' ? 'bg-blue-100 text-blue-800' : 'bg-white'}`}
                onClick={() => setSourceCardinality('one')}
              >
                One
              </button>
              <button
                type="button"
                className={`px-3 py-1 ${sourceCardinality === 'many' ? 'bg-blue-100 text-blue-800' : 'bg-white'}`}
                onClick={() => setSourceCardinality('many')}
              >
                Many
              </button>
            </div>
          </div>
          <select
            value={sourceColumn}
            onChange={(e) => setSourceColumn(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Source Column</option>
            {sourceTables[0]?.columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.fakerCategory}.{col.fakerType})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center items-center gap-4 my-6">
          <div className="h-0.5 w-10 bg-gray-400"></div>
          <div className="text-gray-500">{getRelationshipType()}</div>
          <div className="h-0.5 w-10 bg-gray-400"></div>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Target Table: {targetTables[0]?.name}</label>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm">Cardinality:</label>
            <div className="flex border rounded overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1 ${targetCardinality === 'one' ? 'bg-blue-100 text-blue-800' : 'bg-white'}`}
                onClick={() => setTargetCardinality('one')}
              >
                One
              </button>
              <button
                type="button"
                className={`px-3 py-1 ${targetCardinality === 'many' ? 'bg-blue-100 text-blue-800' : 'bg-white'}`}
                onClick={() => setTargetCardinality('many')}
              >
                Many
              </button>
            </div>
          </div>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Target Column</option>
            {targetTables[0]?.columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.fakerCategory}.{col.fakerType})
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