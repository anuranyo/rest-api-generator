const Project = require('../models/Project');
const SchemaFile = require('../models/SchemaFile');
const { validationResult } = require('express-validator');

/**
 * Generates API endpoints based on schema structure
 * @route POST /api/generator/generate-api
 * @access Private
 */
const generateApi = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.body;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify project ownership
    if (project.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the schema connected to this project
    const schema = await SchemaFile.findById(project.schemaId);
    if (!schema) {
      return res.status(404).json({ message: 'Schema not found for this project' });
    }

    let schemaContent;
    try {
      schemaContent = JSON.parse(schema.content);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid schema structure' });
    }

    // Generate endpoints for each table in the schema
    const { tables } = schemaContent;
    if (!tables || !Array.isArray(tables)) {
      return res.status(400).json({ message: 'Invalid schema format: tables array is required' });
    }

    // Remove any existing endpoints
    project.endpoints = [];

    // Generate new endpoints for each table
    for (const table of tables) {
      const tableName = table.name.toLowerCase();
      const resourceNameSingular = singularize(tableName);
      
      // Create endpoints for the current table
      const generatedEndpoints = [
        // GET all records
        {
          method: 'GET',
          path: `${project.apiPrefix}/${tableName}`,
          description: `Get all ${tableName}`,
          parameters: {
            query: [
              { name: 'page', type: 'number', description: 'Page number for pagination' },
              { name: 'limit', type: 'number', description: 'Number of records per page' },
              // Add sort and filter parameters based on columns
              ...generateQueryParams(table.columns)
            ]
          },
          responses: {
            '200': {
              description: `List of ${tableName}`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: generateResponseProperties(table.columns)
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: { type: 'number' },
                          page: { type: 'number' },
                          limit: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        },
        
        // GET single record
        {
          method: 'GET',
          path: `${project.apiPrefix}/${tableName}/:id`,
          description: `Get a specific ${resourceNameSingular} by ID`,
          parameters: {
            path: [
              { name: 'id', type: 'string', required: true, description: `ID of the ${resourceNameSingular}` }
            ]
          },
          responses: {
            '200': {
              description: `${resourceNameSingular} details`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: generateResponseProperties(table.columns)
                  }
                }
              }
            },
            '404': { description: `${resourceNameSingular} not found` },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        },
        
        // POST create record
        {
          method: 'POST',
          path: `${project.apiPrefix}/${tableName}`,
          description: `Create a new ${resourceNameSingular}`,
          parameters: {
            body: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: generateRequestBodyProperties(table.columns),
                    required: generateRequiredFields(table.columns)
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: `${resourceNameSingular} created successfully`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: generateResponseProperties(table.columns)
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Invalid input' },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        },
        
        // PUT update record
        {
          method: 'PUT',
          path: `${project.apiPrefix}/${tableName}/:id`,
          description: `Update an existing ${resourceNameSingular}`,
          parameters: {
            path: [
              { name: 'id', type: 'string', required: true, description: `ID of the ${resourceNameSingular} to update` }
            ],
            body: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: generateRequestBodyProperties(table.columns)
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: `${resourceNameSingular} updated successfully`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: generateResponseProperties(table.columns)
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Invalid input' },
            '404': { description: `${resourceNameSingular} not found` },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        },
        
        // DELETE record
        {
          method: 'DELETE',
          path: `${project.apiPrefix}/${tableName}/:id`,
          description: `Delete a ${resourceNameSingular}`,
          parameters: {
            path: [
              { name: 'id', type: 'string', required: true, description: `ID of the ${resourceNameSingular} to delete` }
            ]
          },
          responses: {
            '200': {
              description: `${resourceNameSingular} deleted successfully`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { description: `${resourceNameSingular} not found` },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        }
      ];
      
      // Add relationship endpoints if needed
      const relatedEndpoints = generateRelationshipEndpoints(table, tables, project.apiPrefix);
      
      // Add all generated endpoints to the project
      project.endpoints.push(...generatedEndpoints, ...relatedEndpoints);
    }

    project.updatedAt = Date.now();
    await project.save();

    res.status(200).json({
      message: 'API endpoints generated successfully',
      endpoints: project.endpoints
    });
    
  } catch (error) {
    console.error('Error generating API:', error);
    res.status(500).json({ message: 'Server error while generating API' });
  }
};

/**
 * Generate code for endpoints based on schema
 * @route POST /api/generator/generate-code
 * @access Private
 */
const generateCode = async (req, res) => {
  try {
    const { projectId } = req.body;

    // Find the project
    const project = await Project.findById(projectId).populate('schemaId');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify project ownership
    if (project.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!project.schemaId) {
      return res.status(400).json({ message: 'No schema associated with this project' });
    }

    let schemaContent;
    try {
      schemaContent = JSON.parse(project.schemaId.content);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid schema structure' });
    }

    // Generate code for models and controllers
    const models = generateModels(schemaContent.tables);
    const controllers = generateControllers(schemaContent.tables, project.apiPrefix);
    const routes = generateRoutes(schemaContent.tables, project.apiPrefix);

    res.status(200).json({
      message: 'Code generated successfully',
      code: {
        models,
        controllers,
        routes
      }
    });
    
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ message: 'Server error while generating code' });
  }
};

/**
 * Helper function to generate query parameters based on columns
 */
function generateQueryParams(columns) {
  const params = [];
  
  // Add common filter params
  for (const column of columns) {
    // Skip complex objects
    if (!column.name) continue;
    
    params.push({
      name: `filter[${column.name}]`,
      type: 'string',
      description: `Filter by ${column.name}`
    });
  }
  
  // Add sort parameter
  params.push({
    name: 'sort',
    type: 'string',
    description: 'Sort field (prefix with - for descending order)'
  });
  
  return params;
}

/**
 * Helper function to generate response properties from columns
 */
function generateResponseProperties(columns) {
  const properties = {};
  
  for (const column of columns) {
    if (!column.name) continue;
    
    let type = 'string';
    
    // Try to infer type from faker settings
    if (column.faker && column.faker.category) {
      if (['number', 'datatype'].includes(column.faker.category)) {
        type = 'number';
      } else if (column.faker.category === 'date') {
        type = 'string'; // ISO date string
      } else if (column.faker.category === 'boolean') {
        type = 'boolean';
      }
    }
    
    properties[column.name] = { type };
  }
  
  return properties;
}

/**
 * Helper function to generate request body properties
 */
function generateRequestBodyProperties(columns) {
  const properties = {};
  
  for (const column of columns) {
    if (!column.name) continue;
    
    // Skip auto-generated IDs for request body
    if (column.constraints && column.constraints.primaryKey) {
      continue;
    }
    
    let type = 'string';
    
    // Try to infer type from faker settings
    if (column.faker && column.faker.category) {
      if (['number', 'datatype'].includes(column.faker.category)) {
        type = 'number';
      } else if (column.faker.category === 'date') {
        type = 'string'; // ISO date string
      } else if (column.faker.category === 'boolean') {
        type = 'boolean';
      }
    }
    
    properties[column.name] = { type };
  }
  
  return properties;
}

/**
 * Helper function to generate required fields list
 */
function generateRequiredFields(columns) {
  const required = [];
  
  for (const column of columns) {
    if (!column.name) continue;
    
    // Skip auto-generated IDs
    if (column.constraints && column.constraints.primaryKey) {
      continue;
    }
    
    // Add field to required list if it's not nullable
    if (column.constraints && column.constraints.nullable === false) {
      required.push(column.name);
    }
  }
  
  return required;
}

/**
 * Generate relationship endpoints for the table
 */
function generateRelationshipEndpoints(table, allTables, apiPrefix) {
  const endpoints = [];
  const tableName = table.name.toLowerCase();
  const resourceNameSingular = singularize(tableName);
  
  // Check each column for relationships
  for (const column of table.columns) {
    if (column.references && column.references.table) {
      const relatedTable = column.references.table.toLowerCase();
      const relatedResourceSingular = singularize(relatedTable);
      const relationship = column.references.relationship;
      
      if (relationship === 'one-to-many' || relationship === 'many-to-one') {
        // Add endpoint to get related items
        endpoints.push({
          method: 'GET',
          path: `${apiPrefix}/${tableName}/:id/${relatedTable}`,
          description: `Get ${relatedTable} related to this ${resourceNameSingular}`,
          parameters: {
            path: [
              { name: 'id', type: 'string', required: true, description: `ID of the ${resourceNameSingular}` }
            ],
            query: [
              { name: 'page', type: 'number', description: 'Page number for pagination' },
              { name: 'limit', type: 'number', description: 'Number of records per page' }
            ]
          },
          responses: {
            '200': {
              description: `Related ${relatedTable}`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          // We could generate properties based on the related table's columns here
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: { type: 'number' },
                          page: { type: 'number' },
                          limit: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '404': { description: `${resourceNameSingular} not found` },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        });
      } else if (relationship === 'many-to-many') {
        // Add endpoint to manage many-to-many relationships
        endpoints.push({
          method: 'POST',
          path: `${apiPrefix}/${tableName}/:id/${relatedTable}/:relatedId`,
          description: `Associate a ${relatedResourceSingular} with this ${resourceNameSingular}`,
          parameters: {
            path: [
              { name: 'id', type: 'string', required: true, description: `ID of the ${resourceNameSingular}` },
              { name: 'relatedId', type: 'string', required: true, description: `ID of the ${relatedResourceSingular} to associate` }
            ]
          },
          responses: {
            '200': {
              description: 'Association created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { description: 'Resource not found' },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        });
        
        // Add endpoint to remove many-to-many relationship
        endpoints.push({
          method: 'DELETE',
          path: `${apiPrefix}/${tableName}/:id/${relatedTable}/:relatedId`,
          description: `Remove association between a ${relatedResourceSingular} and this ${resourceNameSingular}`,
          parameters: {
            path: [
              { name: 'id', type: 'string', required: true, description: `ID of the ${resourceNameSingular}` },
              { name: 'relatedId', type: 'string', required: true, description: `ID of the ${relatedResourceSingular} to dissociate` }
            ]
          },
          responses: {
            '200': {
              description: 'Association removed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { description: 'Resource not found' },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server error' }
          }
        });
      }
    }
  }
  
  return endpoints;
}

/**
 * Simple plural to singular function
 */
function singularize(word) {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  } else if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Generate routes code for each table
 */
function generateRoutes(tables, apiPrefix) {
  const routes = {};
  
  for (const table of tables) {
    const modelName = capitalize(singularize(table.name));
    const resourceName = table.name.toLowerCase();
    const controllerName = `${modelName}Controller`;
    
    let routeCode = `const express = require('express');\n`;
    routeCode += `const router = express.Router();\n`;
    routeCode += `const { check } = require('express-validator');\n`;
    routeCode += `const ${controllerName} = require('../controllers/${controllerName}');\n`;
    routeCode += `const auth = require('../middleware/auth');\n\n`;
    
    // Add validation arrays
    routeCode += `// Validation for creating and updating ${resourceName}\n`;
    routeCode += `const ${resourceName}Validation = [\n`;
    
    // Add validation rules for each column
    for (const column of table.columns) {
      // Skip primary keys for validation
      if (column.constraints && column.constraints.primaryKey) {
        continue;
      }
      
      // If not nullable, add required validation
      if (column.constraints && column.constraints.nullable === false) {
        routeCode += `  check('${column.name}', '${column.name} is required').not().isEmpty(),\n`;
      }
      
      // Add type validation based on column type if available
      if (column.faker && column.faker.category) {
        if (['number', 'datatype'].includes(column.faker.category)) {
          routeCode += `  check('${column.name}', '${column.name} must be a number').optional().isNumeric(),\n`;
        } else if (column.faker.category === 'internet' && column.faker.type === 'email') {
          routeCode += `  check('${column.name}', 'Please include a valid email').optional().isEmail(),\n`;
        } else if (column.faker.category === 'date') {
          routeCode += `  check('${column.name}', 'Please include a valid date').optional().isDate(),\n`;
        }
      }
    }
    routeCode += `];\n\n`;
    
    // Add routes
    // GET all
    routeCode += `/**\n`;
    routeCode += ` * @route   GET ${apiPrefix}/${resourceName}\n`;
    routeCode += ` * @desc    Get all ${resourceName}\n`;
    routeCode += ` * @access  Private\n`;
    routeCode += ` */\n`;
    routeCode += `router.get('/', auth, ${controllerName}.getAll${modelName}s);\n\n`;
    
    // GET by id
    routeCode += `/**\n`;
    routeCode += ` * @route   GET ${apiPrefix}/${resourceName}/:id\n`;
    routeCode += ` * @desc    Get single ${resourceName} by ID\n`;
    routeCode += ` * @access  Private\n`;
    routeCode += ` */\n`;
    routeCode += `router.get('/:id', auth, ${controllerName}.get${modelName}ById);\n\n`;
    
    // POST create
    routeCode += `/**\n`;
    routeCode += ` * @route   POST ${apiPrefix}/${resourceName}\n`;
    routeCode += ` * @desc    Create a new ${modelName}\n`;
    routeCode += ` * @access  Private\n`;
    routeCode += ` */\n`;
    routeCode += `router.post(\n`;
    routeCode += `  '/',\n`;
    routeCode += `  auth,\n`;
    routeCode += `  ${resourceName}Validation,\n`;
    routeCode += `  ${controllerName}.create${modelName}\n`;
    routeCode += `);\n\n`;
    
    // PUT update
    routeCode += `/**\n`;
    routeCode += ` * @route   PUT ${apiPrefix}/${resourceName}/:id\n`;
    routeCode += ` * @desc    Update a ${modelName}\n`;
    routeCode += ` * @access  Private\n`;
    routeCode += ` */\n`;
    routeCode += `router.put(\n`;
    routeCode += `  '/:id',\n`;
    routeCode += `  auth,\n`;
    routeCode += `  ${resourceName}Validation,\n`;
    routeCode += `  ${controllerName}.update${modelName}\n`;
    routeCode += `);\n\n`;
    
    // DELETE
    routeCode += `/**\n`;
    routeCode += ` * @route   DELETE ${apiPrefix}/${resourceName}/:id\n`;
    routeCode += ` * @desc    Delete a ${modelName}\n`;
    routeCode += ` * @access  Private\n`;
    routeCode += ` */\n`;
    routeCode += `router.delete('/:id', auth, ${controllerName}.delete${modelName});\n\n`;
    
    // Add relationship routes if needed
    for (const column of table.columns) {
      if (column.references && column.references.table) {
        const relatedTable = column.references.table.toLowerCase();
        const relatedModelName = capitalize(singularize(relatedTable));
        const relationship = column.references.relationship;
        
        if (relationship === 'one-to-many' || relationship === 'many-to-one') {
          // Add route to get related items
          routeCode += `/**\n`;
          routeCode += ` * @route   GET ${apiPrefix}/${resourceName}/:id/${relatedTable}\n`;
          routeCode += ` * @desc    Get ${relatedTable} related to a ${modelName}\n`;
          routeCode += ` * @access  Private\n`;
          routeCode += ` */\n`;
          routeCode += `router.get('/:id/${relatedTable}', auth, async (req, res) => {\n`;
          routeCode += `  try {\n`;
          routeCode += `    const ${modelName.toLowerCase()} = await ${modelName}.findById(req.params.id);\n`;
          routeCode += `    if (!${modelName.toLowerCase()}) {\n`;
          routeCode += `      return res.status(404).json({ message: '${modelName} not found' });\n`;
          routeCode += `    }\n\n`;
          routeCode += `    const ${relatedTable} = await ${relatedModelName}.find({ ${column.name}: req.params.id });\n`;
          routeCode += `    res.json(${relatedTable});\n`;
          routeCode += `  } catch (error) {\n`;
          routeCode += `    console.error('Error fetching related ${relatedTable}:', error);\n`;
          routeCode += `    res.status(500).json({ message: 'Server error' });\n`;
          routeCode += `  }\n`;
          routeCode += `});\n\n`;
        } else if (relationship === 'many-to-many') {
          // Add routes for many-to-many relationships
          // These would typically use junction tables in a real implementation
          routeCode += `// Many-to-many relationship endpoints for ${resourceName} and ${relatedTable}\n`;
          routeCode += `// Note: In a real implementation, you would use a junction table\n\n`;
        }
      }
    }
    
    routeCode += `module.exports = router;\n`;
    
    routes[`${resourceName}Routes.js`] = routeCode;
  }
  
  return routes;
}

/**
 * Helper function to capitalize first letter
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Generate Mongoose models based on schema tables
 */
function generateModels(tables) {
  const models = {};
  
  for (const table of tables) {
    const modelName = capitalize(singularize(table.name));
    let modelCode = `const mongoose = require('mongoose');\n`;
    modelCode += `const Schema = mongoose.Schema;\n\n`;
    
    // Start schema definition
    modelCode += `const ${modelName}Schema = new Schema({\n`;
    
    // Add schema fields
    for (const column of table.columns) {
      modelCode += `  ${column.name}: {\n`;
      
      // Determine field type
      let fieldType = 'String';
      if (column.faker && column.faker.category) {
        if (['number', 'datatype'].includes(column.faker.category)) {
          fieldType = 'Number';
        } else if (column.faker.category === 'date') {
          fieldType = 'Date';
        } else if (column.faker.category === 'boolean') {
          fieldType = 'Boolean';
        }
      }
      
      // Handle relationship references
      if (column.references && column.references.table) {
        fieldType = 'Schema.Types.ObjectId';
        modelCode += `    type: ${fieldType},\n`;
        modelCode += `    ref: '${capitalize(singularize(column.references.table))}',\n`;
      } else {
        modelCode += `    type: ${fieldType},\n`;
      }
      
      // Add constraints
      if (column.constraints) {
        if (column.constraints.primaryKey) {
          // For MongoDB, _id is implicit, but we can add a unique index
          if (column.name !== '_id' && column.name !== 'id') {
            modelCode += `    unique: true,\n`;
          }
        } else {
          if (column.constraints.nullable === false) {
            modelCode += `    required: true,\n`;
          }
          if (column.constraints.unique) {
            modelCode += `    unique: true,\n`;
          }
        }
      }
      
      modelCode += `  },\n`;
    }
    
    // Add timestamps
    modelCode += `}, {\n  timestamps: true\n});\n\n`;
    
    // Add indexes if needed
    const primaryKey = table.columns.find(col => col.constraints && col.constraints.primaryKey);
    if (primaryKey && primaryKey.name !== '_id' && primaryKey.name !== 'id') {
      modelCode += `${modelName}Schema.index({ ${primaryKey.name}: 1 }, { unique: true });\n\n`;
    }
    
    // Export the model
    modelCode += `module.exports = mongoose.model('${modelName}', ${modelName}Schema);`;
    
    models[`${modelName}.js`] = modelCode;
  }
  
  return models;
}

/**
 * Generate controller code for each table
 */
function generateControllers(tables, apiPrefix) {
    const controllers = {};
    
    for (const table of tables) {
      const modelName = capitalize(singularize(table.name));
      const resourceName = table.name.toLowerCase();
      const resourceNameSingular = singularize(resourceName);
      
      let controllerCode = `const ${modelName} = require('../models/${modelName}');\n`;
      controllerCode += `const { validationResult } = require('express-validator');\n\n`;
      
      // Get all records
      controllerCode += `/**\n`;
      controllerCode += ` * Get all ${resourceName}\n`;
      controllerCode += ` * @route GET ${apiPrefix}/${resourceName}\n`;
      controllerCode += ` * @access Private\n`;
      controllerCode += ` */\n`;
      controllerCode += `const getAll${modelName}s = async (req, res) => {\n`;
      controllerCode += `  try {\n`;
      controllerCode += `    const page = parseInt(req.query.page) || 1;\n`;
      controllerCode += `    const limit = parseInt(req.query.limit) || 10;\n`;
      controllerCode += `    const skip = (page - 1) * limit;\n\n`;
      
      controllerCode += `    // Build filter query\n`;
      controllerCode += `    const filter = {};\n`;
      controllerCode += `    if (req.query.filter) {\n`;
      controllerCode += `      Object.keys(req.query.filter).forEach(key => {\n`;
      controllerCode += `        filter[key] = req.query.filter[key];\n`;
      controllerCode += `      });\n`;
      controllerCode += `    }\n\n`;
      
      controllerCode += `    // Build sort query\n`;
      controllerCode += `    let sort = {};\n`;
      controllerCode += `    if (req.query.sort) {\n`;
      controllerCode += `      const sortField = req.query.sort.startsWith('-') ? req.query.sort.substring(1) : req.query.sort;\n`;
      controllerCode += `      const sortOrder = req.query.sort.startsWith('-') ? -1 :, 1;\n`;
      controllerCode += `      sort[sortField] = sortOrder;\n`;
      controllerCode += `    } else {\n`;
      controllerCode += `      sort = { createdAt: -1 };\n`;
      controllerCode += `    }\n\n`;
      
      controllerCode += `    const total = await ${modelName}.countDocuments(filter);\n`;
      controllerCode += `    const ${resourceName} = await ${modelName}.find(filter)\n`;
      controllerCode += `      .sort(sort)\n`;
      controllerCode += `      .skip(skip)\n`;
      controllerCode += `      .limit(limit);\n\n`;
      
      controllerCode += `    res.json({\n`;
      controllerCode += `      data: ${resourceName},\n`;
      controllerCode += `      pagination: {\n`;
      controllerCode += `        total,\n`;
      controllerCode += `        page,\n`;
      controllerCode += `        limit,\n`;
      controllerCode += `        pages: Math.ceil(total / limit)\n`;
      controllerCode += `      }\n`;
      controllerCode += `    });\n`;
      controllerCode += `  } catch (error) {\n`;
      controllerCode += `    console.error('Error fetching ${resourceName}:', error);\n`;
      controllerCode += `    res.status(500).json({ message: 'Server error' });\n`;
      controllerCode += `  }\n`;
      controllerCode += `};\n\n`;
      
      // Get single record
      controllerCode += `/**\n`;
      controllerCode += ` * Get single ${resourceNameSingular} by ID\n`;
      controllerCode += ` * @route GET ${apiPrefix}/${resourceName}/:id\n`;
      controllerCode += ` * @access Private\n`;
      controllerCode += ` */\n`;
      controllerCode += `const get${modelName}ById = async (req, res) => {\n`;
      controllerCode += `  try {\n`;
      controllerCode += `    const ${resourceNameSingular} = await ${modelName}.findById(req.params.id);\n\n`;
      
      controllerCode += `    if (!${resourceNameSingular}) {\n`;
      controllerCode += `      return res.status(404).json({ message: '${modelName} not found' });\n`;
      controllerCode += `    }\n\n`;
      
      controllerCode += `    res.json(${resourceNameSingular});\n`;
      controllerCode += `  } catch (error) {\n`;
      controllerCode += `    console.error('Error fetching ${resourceNameSingular}:', error);\n`;
      controllerCode += `    res.status(500).json({ message: 'Server error' });\n`;
      controllerCode += `  }\n`;
      controllerCode += `};\n\n`;
      
      // Create record
      controllerCode += `/**\n`;
      controllerCode += ` * Create a new ${resourceNameSingular}\n`;
      controllerCode += ` * @route POST ${apiPrefix}/${resourceName}\n`;
      controllerCode += ` * @access Private\n`;
      controllerCode += ` */\n`;
      controllerCode += `const create${modelName} = async (req, res) => {\n`;
      controllerCode += `  try {\n`;
      controllerCode += `    const errors = validationResult(req);\n`;
      controllerCode += `    if (!errors.isEmpty()) {\n`;
      controllerCode += `      return res.status(400).json({ errors: errors.array() });\n`;
      controllerCode += `    }\n\n`;
      
      // Extract fields from request body
      controllerCode += `    const new${modelName} = new ${modelName}({\n`;
      for (const column of table.columns) {
        // Skip primary keys that are auto-generated
        if (column.constraints && column.constraints.primaryKey && 
            (column.name === '_id' || column.name === 'id')) {
          continue;
        }
        controllerCode += `      ${column.name}: req.body.${column.name},\n`;
      }
      controllerCode += `    });\n\n`;
      
      controllerCode += `    const saved${modelName} = await new${modelName}.save();\n\n`;
      
      controllerCode += `    res.status(201).json({\n`;
      controllerCode += `      message: '${modelName} created successfully',\n`;
      controllerCode += `      data: saved${modelName}\n`;
      controllerCode += `    });\n`;
      controllerCode += `  } catch (error) {\n`;
      controllerCode += `    console.error('Error creating ${resourceNameSingular}:', error);\n`;
      controllerCode += `    res.status(500).json({ message: 'Server error' });\n`;
      controllerCode += `  }\n`;
      controllerCode += `};\n\n`;
      
      // Update record
      controllerCode += `/**\n`;
      controllerCode += ` * Update a ${resourceNameSingular}\n`;
      controllerCode += ` * @route PUT ${apiPrefix}/${resourceName}/:id\n`;
      controllerCode += ` * @access Private\n`;
      controllerCode += ` */\n`;
      controllerCode += `const update${modelName} = async (req, res) => {\n`;
      controllerCode += `  try {\n`;
      controllerCode += `    const errors = validationResult(req);\n`;
      controllerCode += `    if (!errors.isEmpty()) {\n`;
      controllerCode += `      return res.status(400).json({ errors: errors.array() });\n`;
      controllerCode += `    }\n\n`;
      
      controllerCode += `    let ${resourceNameSingular} = await ${modelName}.findById(req.params.id);\n\n`;
      
      controllerCode += `    if (!${resourceNameSingular}) {\n`;
      controllerCode += `      return res.status(404).json({ message: '${modelName} not found' });\n`;
      controllerCode += `    }\n\n`;
      
      // Build update object
      controllerCode += `    const updateFields = {};\n`;
      for (const column of table.columns) {
        // Skip primary keys
        if (column.constraints && column.constraints.primaryKey) {
          continue;
        }
        controllerCode += `    if (req.body.${column.name} !== undefined) updateFields.${column.name} = req.body.${column.name};\n`;
      }
      controllerCode += `\n`;
      
      controllerCode += `    ${resourceNameSingular} = await ${modelName}.findByIdAndUpdate(\n`;
      controllerCode += `      req.params.id,\n`;
      controllerCode += `      { $set: updateFields },\n`;
      controllerCode += `      { new: true }\n`;
      controllerCode += `    );\n\n`;
      
      controllerCode += `    res.json({\n`;
      controllerCode += `      message: '${modelName} updated successfully',\n`;
      controllerCode += `      data: ${resourceNameSingular}\n`;
      controllerCode += `    });\n`;
      controllerCode += `  } catch (error) {\n`;
      controllerCode += `    console.error('Error updating ${resourceNameSingular}:', error);\n`;
      controllerCode += `    res.status(500).json({ message: 'Server error' });\n`;
      controllerCode += `  }\n`;
      controllerCode += `};\n\n`;
      
      // Delete record
      controllerCode += `/**\n`;
      controllerCode += ` * Delete a ${resourceNameSingular}\n`;
      controllerCode += ` * @route DELETE ${apiPrefix}/${resourceName}/:id\n`;
      controllerCode += ` * @access Private\n`;
      controllerCode += ` */\n`;
      controllerCode += `const delete${modelName} = async (req, res) => {\n`;
      controllerCode += `  try {\n`;
      controllerCode += `    const ${resourceNameSingular} = await ${modelName}.findById(req.params.id);\n\n`;
      
      controllerCode += `    if (!${resourceNameSingular}) {\n`;
      controllerCode += `      return res.status(404).json({ message: '${modelName} not found' });\n`;
      controllerCode += `    }\n\n`;
      
      controllerCode += `    await ${resourceNameSingular}.deleteOne();\n\n`;
      
      controllerCode += `    res.json({ message: '${modelName} deleted successfully' });\n`;
      controllerCode += `  } catch (error) {\n`;
      controllerCode += `    console.error('Error deleting ${resourceNameSingular}:', error);\n`;
      controllerCode += `    res.status(500).json({ message: 'Server error' });\n`;
      controllerCode += `  }\n`;
      controllerCode += `};\n\n`;
      
      // Export controller methods
      controllerCode += `module.exports = {\n`;
      controllerCode += `  getAll${modelName}s,\n`;
      controllerCode += `  get${modelName}ById,\n`;
      controllerCode += `  create${modelName},\n`;
      controllerCode += `  update${modelName},\n`;
      controllerCode += `  delete${modelName}\n`;
      controllerCode += `};\n`;
      
      controllers[`${modelName}Controller.js`] = controllerCode;
    }
    
    return controllers;
  }
  
module.exports = {
generateApi,
generateCode
};