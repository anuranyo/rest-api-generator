import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const EditRelationshipModal = ({
  relationship,
  sourceTable,
  targetTable,
  onClose,
  onUpdateRelationship,
  onDeleteRelationship,
}) => {
  const [sourceCardinality, setSourceCardinality] = useState(relationship.sourceCardinality || 'one');
  const [targetCardinality, setTargetCardinality] = useState(relationship.targetCardinality || 'many');
  const [relationshipType, setRelationshipType] = useState(relationship.type);

  useEffect(() => {
    setSourceCardinality(relationship.sourceCardinality || 'one');
    setTargetCardinality(relationship.targetCardinality || 'many');
    setRelationshipType(relationship.type);
  }, [relationship]);

  const handleSave = () => {
    const updatedRelationship = {
      ...relationship,
      sourceCardinality: sourceCardinality,
      targetCardinality: targetCardinality,
      type: getRelationshipType(),
    };
    onUpdateRelationship(updatedRelationship);
    onClose();
  };

  const handleDelete = () => {
    onDeleteRelationship(relationship.id);
    onClose();
  };

  const getRelationshipType = () => {
    if (sourceCardinality === 'one' && targetCardinality === 'one') {
      return 'one-to-one';
    } else if (sourceCardinality === 'many' && targetCardinality === 'many') {
      return 'many-to-many';
    } else if (sourceCardinality === 'one' && targetCardinality === 'many') {
      return 'one-to-many';
    } else {
      return 'many-to-one';
    }
  };

  // Find the connected columns
  const sourceColumn = sourceTable?.columns.find(col => col.id === relationship.sourceColumnId);
  const targetColumn = targetTable?.columns.find(col => col.id === relationship.targetColumnId);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative"
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-4">
          Edit Relationship
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Connected Fields:
            </label>
            <p className="text-sm">
              {sourceTable.name}.{sourceColumn?.name} 
              <span className="text-gray-400 text-xs"> ({sourceColumn?.fakerCategory}.{sourceColumn?.fakerType})</span>
              {" → "}
              {targetTable.name}.{targetColumn?.name}
              <span className="text-gray-400 text-xs"> ({targetColumn?.fakerCategory}.{targetColumn?.fakerType})</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Relationship Type:
            </label>
            <p className="text-sm">
              {sourceTable.name} ({sourceCardinality}) - {targetTable.name} ({targetCardinality})
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Source Cardinality:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1 text-sm rounded-md ${sourceCardinality === 'one' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setSourceCardinality('one')}
              >
                One
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-sm rounded-md ${sourceCardinality === 'many' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setSourceCardinality('many')}
              >
                Many
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Target Cardinality:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1 text-sm rounded-md ${targetCardinality === 'one' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setTargetCardinality('one')}
              >
                One
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-sm rounded-md ${targetCardinality === 'many' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setTargetCardinality('many')}
              >
                Many
              </button>
            </div>
          </div>

          <div className="flex justify-between gap-4 mt-6">
             <button
              onClick={handleDelete}
              className="text-sm px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-sm px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};