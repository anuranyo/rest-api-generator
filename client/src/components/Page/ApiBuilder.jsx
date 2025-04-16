import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DBSchema from '../Form/DBSchema';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

import Header from '../Landing/Header';

const ApiBuilder = () => {
  const [jsonSchema, setJsonSchema] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const tables = useStore((state) => state.tables);
  const relationships = useStore((state) => state.relationships);
  const addTable = useStore((state) => state.addTable);
  const addColumn = useStore((state) => state.addColumn);
  const updateColumn = useStore((state) => state.updateColumn);
  const addRelationship = useStore((state) => state.addRelationship);

  const schemaRef = useRef(null); // useRef to hold the schema reference

  // Определяем, показывать ли Import панель (показываем только если нет таблиц)
  const showImportPanel = tables.length === 0;

  useEffect(() => {
    if (tables.length > 0) {
      // Generate comprehensive JSON schema with Faker.js details
      const schema = {
        tables: tables.map((table) => ({
          name: table.name,
          columns: table.columns.map((col) => {
            // Find any relationships for this column
            const relatedRelationships = relationships.filter(
              rel =>
                (rel.sourceTableId === table.id && rel.sourceColumnId === col.id) ||
                (rel.targetTableId === table.id && rel.targetColumnId === col.id)
            );

            const columnSchema = {
              name: col.name,
              faker: {
                active: col.useFaker,
                category: col.fakerCategory,
                type: col.fakerType
              },
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
          sourceCardinality: rel.sourceCardinality || 'one',
          targetCardinality: rel.targetCardinality || 'many',
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

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const processSchemaTables = (schema) => { // Function to process tables only
    return new Promise((resolve) => { // Return a Promise
      const tableMap = new Map();
      schema.tables.forEach((tableSchema, index) => {
        const position = {
          x: 150 + (index % 3) * 300,
          y: 100 + Math.floor(index / 3) * 250
        };
        const tableId = uuidv4();
        tableMap.set(tableSchema.name, tableId);
        addTable(tableSchema.name, position, tableId);
        console.log(`Table "${tableSchema.name}" added with ID: ${tableId}`);
      });
      resolve(tableMap); // Resolve with tableMap after tables are added
    });
  };

  const processSchemaColumnsAndRelationships = (schema, tableMap) => {
    return new Promise((resolve) => {
      const columnMap = new Map();
      const addedRelationships = new Set();

      schema.tables.forEach((tableSchema) => {
        const tableId = tableMap.get(tableSchema.name);
        if (!tableId) return;

        if (tableSchema.columns && Array.isArray(tableSchema.columns)) {
          tableSchema.columns.forEach(colSchema => {
            if (!colSchema.name) {
              throw new Error(`Column in table ${tableSchema.name} missing name`);
            }
            console.log(`Processing column "${colSchema.name}" in table "${tableSchema.name}"`);

            // Default faker values if not provided
            const fakerCategory = colSchema.faker?.category || 'name';
            const fakerType = colSchema.faker?.type || 'fullName';
            const useFaker = colSchema.faker?.active !== false; // Default to true if not specified

            const isPrimaryKeyId = colSchema.name === 'id' && colSchema.constraints?.primaryKey;
            let columnId;

            if (isPrimaryKeyId) {
              // Access tables DIRECTLY from Zustand state here:
              const currentTables = useStore.getState().tables;
              const table = currentTables.find(t => t.id === tableId);
              if (table) {
                const defaultColumn = table.columns.find(c => c.name === 'id');
                if (defaultColumn) {
                  columnId = defaultColumn.id;
                  updateColumn(tableId, columnId, {
                    isPrimaryKey: true,
                    isForeignKey: !!colSchema.references,
                    isNullable: !!colSchema.constraints?.nullable,
                    isUnique: !!colSchema.constraints?.unique,
                    useFaker: useFaker,
                    fakerCategory: fakerCategory,
                    fakerType: fakerType
                  });
                  console.log(`Updated default column "id" in table "${tableSchema.name}" with constraints. Column ID: ${columnId}`);
                }
              }
            } else {
              columnId = uuidv4();
              // Use the new column structure with Faker.js
              addColumn(tableId, colSchema.name, fakerCategory, fakerType);
              console.log(`addColumn called for column "${colSchema.name}" in table "${tableSchema.name}". New Column ID: ${columnId}`);
              updateColumn(tableId, columnId, {
                isPrimaryKey: !!colSchema.constraints?.primaryKey,
                isForeignKey: !!colSchema.constraints?.foreignKey || !!colSchema.references,
                isNullable: !!colSchema.constraints?.nullable,
                isUnique: !!colSchema.constraints?.unique,
                useFaker: useFaker,
                fakerCategory: fakerCategory,
                fakerType: fakerType
              });
            }

            if (columnId) {
              const columnMapKey = `${tableSchema.name}.${colSchema.name}`;
              columnMap.set(columnMapKey, columnId);
              console.log(`Column ID "${columnId}" mapped for "${columnMapKey}"`);
            } else {
              console.log(`columnId is NOT set for column "${colSchema.name}" in table "${tableSchema.name}"`);
            }
          });
        }
      });

      setTimeout(() => {
        console.log("Table Map (before relationships):", tableMap);
        console.log("Column Map (before relationships):", columnMap);

        // Third pass: Create relationships from the explicit relationships array
        if (schema.relationships && Array.isArray(schema.relationships)) {
          schema.relationships.forEach(relSchema => {
            console.log("Processing relationship from schema:", relSchema);
            if (!relSchema.source?.table || !relSchema.source?.column ||
              !relSchema.target?.table || !relSchema.target?.column) {
              console.warn('Skipping invalid relationship', relSchema);
              return;
            }

            const sourceTableId = tableMap.get(relSchema.source.table);
            const targetTableId = tableMap.get(relSchema.target.table);

            if (!sourceTableId || !targetTableId) {
              console.warn('Could not find table for relationship', relSchema);
              return;
            }

            const sourceColumnMapKey = `${relSchema.source.table}.${relSchema.source.column}`;
            const targetColumnMapKey = `${relSchema.target.table}.${relSchema.target.column}`;

            const sourceColumnId = columnMap.get(sourceColumnMapKey);
            const targetColumnId = columnMap.get(targetColumnMapKey);

            if (!sourceColumnId || !targetColumnId) {
              console.warn('Could not find columns for relationship', relSchema);
              return;
            }
            console.log(`Source Table ID: ${sourceTableId}, Source Column ID: ${sourceColumnId}`);
            console.log(`Target Table ID: ${targetTableId}, Target Column ID: ${targetColumnId}`);


            const relationshipKey = `${sourceTableId}:${sourceColumnId}-${targetTableId}:${targetColumnId}`;
            const reverseRelationshipKey = `${targetTableId}:${targetColumnId}-${sourceTableId}:${sourceColumnId}`;

            if (!addedRelationships.has(relationshipKey) && !addedRelationships.has(reverseRelationshipKey)) {
              const relationshipToAdd = {
                id: relSchema.id,
                sourceTableId: sourceTableId,
                sourceColumnId: sourceColumnId,
                targetTableId: targetTableId,
                targetColumnId: targetColumnId,
                type: relSchema.type || 'one-to-many',
                sourceCardinality: relSchema.sourceCardinality || 'one',
                targetCardinality: relSchema.targetCardinality || 'many'
              };
              console.log("Adding relationship:", relationshipToAdd);
              addRelationship(relationshipToAdd);
              console.log("Relationship added to store.");
              addedRelationships.add(relationshipKey);

              if (relSchema.type === 'one-to-one' || relSchema.type === 'one-to-many') {
                updateColumn(sourceTableId, sourceColumnId, {
                  isForeignKey: true
                });
              } else if (relSchema.type === 'many-to-many') {
                updateColumn(sourceTableId, sourceColumnId, {
                  isForeignKey: true
                });
                updateColumn(targetTableId, targetColumnId, {
                  isForeignKey: true
                });
              }
            }
          });
        }

        // Fourth pass: Create relationships from column references
        schema.tables.forEach(tableSchema => {
          const tableId = tableMap.get(tableSchema.name);
          if (!tableId) return;

          if (tableSchema.columns && Array.isArray(tableSchema.columns)) {
            tableSchema.columns.forEach(colSchema => {
              if (colSchema.references) {
                const sourceColumnMapKey = `${tableSchema.name}.${colSchema.name}`;
                const sourceColumnId = columnMap.get(sourceColumnMapKey);

                const targetTableId = tableMap.get(colSchema.references.table);
                const targetColumnMapKey = `${colSchema.references.table}.${colSchema.references.column}`;
                const targetColumnId = columnMap.get(targetColumnMapKey);

                if (sourceColumnId && targetTableId && targetColumnId) {
                  const relationshipKey = `${tableId}:${sourceColumnId}-${targetTableId}:${targetColumnId}`;
                  const reverseRelationshipKey = `${targetTableId}:${targetColumnId}-${tableId}:${sourceColumnId}`;

                  if (!addedRelationships.has(relationshipKey) && !addedRelationships.has(reverseRelationshipKey)) {
                    // Parse relationship type to determine cardinality
                    let sourceCardinality = 'one';
                    let targetCardinality = 'many';
                    
                    if (colSchema.references.relationship === 'one-to-one') {
                      sourceCardinality = 'one';
                      targetCardinality = 'one';
                    } else if (colSchema.references.relationship === 'many-to-many') {
                      sourceCardinality = 'many';
                      targetCardinality = 'many';
                    } else if (colSchema.references.relationship === 'many-to-one') {
                      sourceCardinality = 'many';
                      targetCardinality = 'one';
                    }
                    
                    const relationshipToAdd = {
                      sourceTableId: tableId,
                      sourceColumnId: sourceColumnId,
                      targetTableId: targetTableId,
                      targetColumnId: targetColumnId,
                      type: colSchema.references.relationship || 'one-to-many',
                      sourceCardinality,
                      targetCardinality
                    };
                    console.log("Adding relationship from references:", relationshipToAdd);
                    addRelationship(relationshipToAdd);
                    console.log("Relationship from references added to store.");
                    addedRelationships.add(relationshipKey);

                    updateColumn(tableId, sourceColumnId, {
                      isForeignKey: true
                    });

                    if (colSchema.references.relationship === 'many-to-many' ||
                      colSchema.references.relationship === 'one-to-one') {
                      updateColumn(targetTableId, targetColumnId, {
                        isForeignKey: true
                      });
                    }
                  }
                }
              }
            });
          }
        });


        console.log("Final Relationships State:", useStore.getState().relationships);
        resolve({ columnMap, addedRelationships });
      }, 300);
    });
  };

  const processImportedSchema = (schema) => {
    setImportSuccess(false);
    schemaRef.current = schema; // Store schema in ref

    processSchemaTables(schema)
      .then((tableMap) => {
        return processSchemaColumnsAndRelationships(schema, tableMap);
      })
      .then(() => {
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      })
      .catch((error) => {
        console.error('Error processing schema:', error);
        alert(`Error importing schema: ${error.message}`);
      });
  };


  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];

    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setJsonSchema(json);
          processImportedSchema(json); // Call processImportedSchema here
        } catch (error) {
          alert('Invalid JSON file');
          console.error(error);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please drop a JSON file only');
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col h-screen">
      <Header title="API Builder" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50 mt-16 h-screen">
        {/* Left Side: Schema Graph Sandbox */}
        <div className="bg-white shadow rounded-2xl p-6 overflow-y-auto h-2/5">
          <DBSchema />
        </div>

        {/* Right Side: JSON Import + Output */}
        <div className="bg-white shadow rounded-2xl p-6 transition-colors duration-200 relative">
          {/* Панель импорта JSON (видима только если нет таблиц) */}
          {showImportPanel ? (
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`absolute inset-0 rounded-2xl border-2 border-dashed p-6 flex flex-col gap-4 ${
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
            >
              {importSuccess && (
                <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded shadow">
                  Schema imported successfully!
                </div>
              )}

              <div className="text-center text-gray-600 py-8">
                <div className="text-4xl mb-4">📥</div>
                <p className="font-medium text-lg mb-2">Drag and Drop JSON Schema File Here</p>
                <p className="text-sm text-gray-400 mb-4">Only JSON files (.json) are accepted</p>
                <p className="text-sm text-gray-500">
                  The schema will be used to create tables in the diagram
                </p>
              </div>
            </div>
          ) : null}

          {/* Отображение JSON (всегда видимо) */}
          <div className={`${showImportPanel ? 'invisible' : 'visible'}`}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Current JSON Schema</h4>
            {jsonSchema ? (
              <div className="bg-gray-100 p-3 rounded text-left">
                <pre className="text-xs whitespace-pre-wrap break-words font-mono max-h-[500px] overflow-y-auto">
                  {JSON.stringify(jsonSchema, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No schema available yet. Add tables to the diagram to generate a schema.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiBuilder;