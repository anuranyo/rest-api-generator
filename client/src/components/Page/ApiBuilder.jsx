import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DBSchema from '../Form/DBSchema';
import { useStore } from '../store';

import Header from '../Landing/Header';

const ApiBuilder = () => {
  const [jsonSchema, setJsonSchema] = useState(null);
  const tables = useStore((state) => state.tables);
  const relationships = useStore((state) => state.relationships);

  useEffect(() => {
    if (tables.length > 0) {
      // Generate comprehensive JSON schema
      const schema = {
        tables: tables.map((table) => ({
          name: table.name,
          columns: table.columns.map((col) => {
            // Find any relationships for this column
            const relatedRelationships = relationships.filter(
              rel => 
                rel.sourceTableId === table.id && rel.sourceColumnId === col.id ||
                rel.targetTableId === table.id && rel.targetColumnId === col.id
            );

            const columnSchema = {
              name: col.name,
              type: col.type,
              constraints: {
                primaryKey: col.isPrimaryKey,
                foreignKey: col.isForeignKey,
                nullable: col.isNullable,
                unique: col.isUnique
              }
            };

            // Add relationship reference if applicable
            if (relatedRelationships.length > 0) {
              const relationship = relatedRelationships[0];
              const isSourceColumn = relationship.sourceColumnId === col.id;
              columnSchema.references = {
                table: isSourceColumn 
                  ? tables.find(t => t.id === relationship.targetTableId)?.name || ''
                  : tables.find(t => t.id === relationship.sourceTableId)?.name || '',
                column: isSourceColumn 
                  ? tables.find(t => t.id === relationship.targetTableId)?.columns.find(c => c.id === relationship.targetColumnId)?.name || ''
                  : tables.find(t => t.id === relationship.sourceTableId)?.columns.find(c => c.id === relationship.sourceColumnId)?.name || '',
                relationship: relationship.type
              };
            }

            return columnSchema;
          })
        })),
        relationships: relationships.map(rel => ({
          id: rel.id,
          type: rel.type,
          source: {
            table: tables.find(t => t.id === rel.sourceTableId)?.name || '',
            column: tables.find(t => t.id === rel.sourceTableId)?.columns.find(c => c.id === rel.sourceColumnId)?.name || ''
          },
          target: {
            table: tables.find(t => t.id === rel.targetTableId)?.name || '',
            column: tables.find(t => t.id === rel.targetTableId)?.columns.find(c => c.id === rel.targetColumnId)?.name || ''
          }
        }))
      };

      setJsonSchema(schema);
    }
  }, [tables, relationships]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setJsonSchema(json);
        } catch {
          alert('Invalid JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteJson = (e) => {
    try {
      const json = JSON.parse(e.target.value);
      setJsonSchema(json);
    } catch {
      alert('Invalid JSON');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header title="API Builder" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 min-h-screen bg-gray-50 mt-16">
        {/* Left Side: Schema Graph Sandbox */}
        <div className="bg-white shadow rounded-2xl p-6 overflow-y-auto h-full">
          <DBSchema />
        </div>

        {/* Right Side: JSON Import + Output */}
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          className="bg-white shadow rounded-2xl p-6 border-2 border-dashed border-gray-300 flex flex-col gap-4"
        >
          <div className="text-center text-gray-600">
            <div className="text-2xl">📥</div>
            <p className="font-medium">Drag and Drop here</p>
            <p className="text-sm text-gray-400">or paste JSON below</p>
          </div>
          <textarea
            rows={8}
            className="w-full border rounded-lg p-2 text-sm font-mono text-gray-700"
            placeholder="Paste your JSON schema here..."
            onBlur={handlePasteJson}
          ></textarea>

          {jsonSchema && (
            <div className="text-left mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Generated JSON Schema</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-[300px] text-left">
                {JSON.stringify(jsonSchema, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiBuilder;