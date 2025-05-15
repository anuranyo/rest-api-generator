import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DBSchema from '../Form/DBSchema';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

import Header from '../Landing/Header';

const ApiBuilder = () => {
  const [jsonSchema, setJsonSchema] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tables = useStore((state) => state.tables);
  const relationships = useStore((state) => state.relationships);
  const addTable = useStore((state) => state.addTable);
  const addColumn = useStore((state) => state.addColumn);
  const updateColumn = useStore((state) => state.updateColumn);
  const addRelationship = useStore((state) => state.addRelationship);
  const clearStore = useStore((state) => state.clearStore);

  const schemaRef = useRef(null); // useRef to hold the schema reference

  // Get project ID from URL params
  useEffect(() => {
    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      setProjectId(projectIdParam);
      fetchProjectData(projectIdParam);
    }
  }, [searchParams]);

  // Fetch project data and load existing schema if available
  const fetchProjectData = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const project = await response.json();
      setProjectData(project);

      // If project has a schema, load it
      if (project.schemaId) {
        const clearCurrentStore = useStore.getState().clearStore;
        clearCurrentStore(); // Clear existing data
        
        console.log('Loading schema from project:', project.schemaId);
        
        // Parse the content to get the original schema
        if (project.schemaId.content) {
          try {
            const parsedSchema = JSON.parse(project.schemaId.content);
            console.log('Parsed schema from content:', parsedSchema);
            processImportedSchema(parsedSchema);
          } catch (error) {
            console.error('Error parsing schema content:', error);
            toast.error('Failed to parse schema content');
          }
        } else if (project.schemaId.structure) {
          // Fallback: if no content, try structure (but it may not have full schema)
          console.log('No content found, trying structure:', project.schemaId.structure);
          processImportedSchema(project.schemaId.structure);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project data');
    }
  };

  // Add debugging effect to watch store changes
  useEffect(() => {
    console.log('Store state changed:');
    console.log('Tables:', tables.length);
    console.log('Relationships:', relationships.length);
    console.log('Actual relationships:', relationships);
  }, [tables, relationships]);

  // Show Import panel only if there are no tables
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

  // Save schema to backend
  const saveSchema = async () => {
    if (!projectId || !jsonSchema) {
      toast.error('No project or schema to save');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // First, upload the schema file
      const schemaResponse = await fetch('/api/schemas/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(jsonSchema),
          filename: `${projectData?.name || 'project'}_schema.json`,
        }),
      });

      if (!schemaResponse.ok) {
        throw new Error('Failed to upload schema');
      }

      const schemaData = await schemaResponse.json();
      
      // Update project with schema ID
      const updateResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaId: schemaData.schemaId,
          name: projectData.name,
          apiPrefix: projectData.apiPrefix,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update project');
      }

      toast.success('Schema saved successfully');
      
      // Navigate to project view page
      navigate(`/projects/${projectId}/view`);
      
    } catch (error) {
      console.error('Error saving schema:', error);
      toast.error('Failed to save schema');
    } finally {
      setLoading(false);
    }
  };

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

      // First pass: Add all columns to tables
      const columnAddPromises = [];
      
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
            const useFaker = colSchema.faker?.active !== false;

            const isPrimaryKeyId = colSchema.name === 'id' && colSchema.constraints?.primaryKey;

            if (isPrimaryKeyId) {
              // Update existing ID column
              const currentTables = useStore.getState().tables;
              const table = currentTables.find(t => t.id === tableId);
              if (table) {
                const defaultColumn = table.columns.find(c => c.name === 'id');
                if (defaultColumn) {
                  updateColumn(tableId, defaultColumn.id, {
                    isPrimaryKey: true,
                    isForeignKey: !!colSchema.references,
                    isNullable: !!colSchema.constraints?.nullable,
                    isUnique: !!colSchema.constraints?.unique,
                    useFaker: useFaker,
                    fakerCategory: fakerCategory,
                    fakerType: fakerType
                  });
                }
              }
            } else {
              // Add new column
              addColumn(tableId, colSchema.name, fakerCategory, fakerType);
            }
          });
        }
      });

      // Wait for all columns to be added and then map them by name
      setTimeout(() => {
        // Build column map based on actual columns in store
        const currentTables = useStore.getState().tables;
        
        schema.tables.forEach((tableSchema) => {
          const tableId = tableMap.get(tableSchema.name);
          if (!tableId) return;
          
          const table = currentTables.find(t => t.id === tableId);
          if (!table) return;
          
          // Update column properties based on schema
          tableSchema.columns.forEach(colSchema => {
            const column = table.columns.find(c => c.name === colSchema.name);
            if (column) {
              // Map column by table name and column name
              const columnMapKey = `${tableSchema.name}.${colSchema.name}`;
              columnMap.set(columnMapKey, column.id);
              console.log(`Mapped column: ${columnMapKey} -> ${column.id}`);
              
              // Update column properties
              updateColumn(tableId, column.id, {
                isPrimaryKey: !!colSchema.constraints?.primaryKey,
                isForeignKey: !!colSchema.references || !!colSchema.constraints?.foreignKey,
                isNullable: colSchema.constraints?.nullable !== false,
                isUnique: !!colSchema.constraints?.unique,
                useFaker: colSchema.faker?.active !== false,
                fakerCategory: colSchema.faker?.category || column.fakerCategory,
                fakerType: colSchema.faker?.type || column.fakerType
              });
            }
          });
        });

        console.log("Column Map after mapping:", columnMap);

        // Now process relationships with the correct column IDs
        if (schema.relationships && Array.isArray(schema.relationships)) {
          console.log(`Processing ${schema.relationships.length} relationships from schema`);
          
          schema.relationships.forEach((relSchema, index) => {
            console.log(`Processing relationship ${index + 1}:`, relSchema);
            
            if (!relSchema.source?.table || !relSchema.source?.column ||
                !relSchema.target?.table || !relSchema.target?.column) {
              console.warn('Invalid relationship structure:', relSchema);
              return;
            }

            const sourceTableId = tableMap.get(relSchema.source.table);
            const targetTableId = tableMap.get(relSchema.target.table);

            if (!sourceTableId || !targetTableId) {
              console.warn('Tables not found for relationship:', relSchema);
              console.warn('Source table:', relSchema.source.table, '-> ID:', sourceTableId);
              console.warn('Target table:', relSchema.target.table, '-> ID:', targetTableId);
              console.warn('Available tables:', Array.from(tableMap.keys()));
              return;
            }

            // Get column IDs by name
            const sourceColumnKey = `${relSchema.source.table}.${relSchema.source.column}`;
            const targetColumnKey = `${relSchema.target.table}.${relSchema.target.column}`;
            
            const sourceColumnId = columnMap.get(sourceColumnKey);
            const targetColumnId = columnMap.get(targetColumnKey);

            if (!sourceColumnId || !targetColumnId) {
              console.warn(`Columns not found for relationship ${index + 1}`);
              console.warn(`Source: ${sourceColumnKey} -> ${sourceColumnId}`);
              console.warn(`Target: ${targetColumnKey} -> ${targetColumnId}`);
              console.warn('Available columns:', Array.from(columnMap.keys()));
              return;
            }

            const relationshipKey = `${sourceTableId}:${sourceColumnId}-${targetTableId}:${targetColumnId}`;
            const reverseRelationshipKey = `${targetTableId}:${targetColumnId}-${sourceTableId}:${sourceColumnId}`;

            if (!addedRelationships.has(relationshipKey) && !addedRelationships.has(reverseRelationshipKey)) {
              const relationshipToAdd = {
                id: uuidv4(), // Always generate new ID for relationship
                sourceTableId: sourceTableId,
                sourceColumnId: sourceColumnId,
                targetTableId: targetTableId,
                targetColumnId: targetColumnId,
                type: relSchema.type || 'one-to-many',
                sourceCardinality: relSchema.sourceCardinality || 'one',
                targetCardinality: relSchema.targetCardinality || 'many'
              };
              
              console.log(`Adding relationship ${index + 1} with new IDs:`, relationshipToAdd);
              addRelationship(relationshipToAdd);
              addedRelationships.add(relationshipKey);
              console.log(`Relationship ${index + 1} added successfully`);

              // Mark columns as foreign keys
              updateColumn(sourceTableId, sourceColumnId, { isForeignKey: true });
              
              if (relSchema.type === 'one-to-one' || relSchema.type === 'many-to-many') {
                updateColumn(targetTableId, targetColumnId, { isForeignKey: true });
              }
            } else {
              console.log(`Relationship ${index + 1} already exists (or reverse exists)`);
            }
          });
        } else {
          console.warn('No relationships array found in schema or it is empty');
        }

        console.log("Final state - Tables:", useStore.getState().tables);
        console.log("Final state - Relationships:", useStore.getState().relationships);
        
        resolve({ columnMap, addedRelationships });
      }, 500); // Wait for columns to be added to store
    });
  };

  const processImportedSchema = (schema) => {
    setImportSuccess(false);
    schemaRef.current = schema; // Store schema in ref
    
    console.log('Processing imported schema:', schema);
    console.log('Schema has relationships:', schema.relationships?.length || 0);

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
      <Header title={projectData ? `API Builder - ${projectData.name}` : "API Builder"} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50 mt-16 h-screen">
        {/* Left Side: Schema Graph Sandbox */}
        <div className="bg-white shadow rounded-2xl p-6 overflow-y-auto h-2/5">
          <DBSchema />
        </div>

        {/* Right Side: JSON Import + Output */}
        <div className="bg-white shadow rounded-2xl p-6 transition-colors duration-200 relative">
          {/* Save button for project schemas */}
          {projectId && jsonSchema && tables.length > 0 && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={saveSchema}
                disabled={loading}
                className={`px-4 py-2 rounded text-white font-medium transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Saving...' : 'Save Schema'}
              </button>
            </div>
          )}

          {/* Import panel (visible only if no tables) */}
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

          {/* Display JSON (always visible) */}
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