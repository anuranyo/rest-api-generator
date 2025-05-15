/**
* Main schema analysis function
* @param {Object} schema - JSON schema to analyze
* @returns {Object} Analysis results with tables and relations
*/
const analyzeSchema = async (schema) => {
    try {
      const result = {
        tables: [],
        relations: []
      };
  
      if (schema.tables) {
        result.tables = extractTablesFromArray(schema.tables);
      } else if (typeof schema === 'object') {
        result.tables = extractTablesFromObject(schema);
      }
  
      // Extract relationships from the schema.relationships array if it exists
      if (schema.relationships) {
        result.relations = schema.relationships.map(rel => ({
          sourceTable: rel.source.table,
          targetTable: rel.target.table,
          sourceColumn: rel.source.column,
          targetColumn: rel.target.column,
          relationType: rel.type
        }));
      } else {
        result.relations = detectRelations(result.tables, schema);
      }
  
      return result;
    } catch (error) {
      console.error('Schema analysis error:', error);
      throw new Error('Error during JSON schema analysis');
    }
};
  
/**
* Extract table information from array
* @param {Array} tables - Array of tables
* @returns {Array} Structured table data
*/
const extractTablesFromArray = (tables) => {
    return tables.map(table => {
      const tableInfo = {
        name: table.name,
        columns: []
      };
  
      if (table.columns && Array.isArray(table.columns)) {
        tableInfo.columns = table.columns.map(column => ({
          name: column.name,
          type: mapDataType(column.type),
          isPrimary: column.constraints?.primaryKey || false,
          isNullable: column.constraints?.nullable !== false,
          isUnique: column.constraints?.unique || false,
          defaultValue: column.defaultValue,
          // Preserve faker information
          faker: column.faker || null,
          // Preserve the original type if it's a faker type
          fakerType: column.faker ? `${column.faker.category}.${column.faker.type}` : null
        }));
      }
  
      return tableInfo;
    });
};
  
/**
* Extract table information from object
* @param {Object} schema - JSON schema
* @returns {Array} Structured table data
*/
const extractTablesFromObject = (schema) => {
    const tables = [];
  
    for (const [tableName, tableData] of Object.entries(schema)) {
      if (tableName.startsWith('_') || typeof tableData !== 'object') {
        continue;
      }
  
      const tableInfo = {
        name: tableName,
        columns: []
      };
  
      if (tableData.columns) {
        tableInfo.columns = processColumns(tableData.columns);
      } else if (tableData.fields) {
        tableInfo.columns = processFields(tableData.fields);
      } else {
        tableInfo.columns = processGenericObject(tableData);
      }
  
      tables.push(tableInfo);
    }
  
    return tables;
};
  
/**
* Process columns array
* @param {Array} columns - Array of columns
* @returns {Array} Structured column data
*/
const processColumns = (columns) => {
    if (!Array.isArray(columns)) return [];
  
    return columns.map(column => ({
      name: column.name,
      type: mapDataType(column.type),
      isPrimary: column.primaryKey || column.primary || false,
      isNullable: column.nullable !== false,
      isUnique: column.unique || false,
      defaultValue: column.default || column.defaultValue,
      // Preserve faker information
      faker: column.faker || null,
      fakerType: column.faker ? `${column.faker.category}.${column.faker.type}` : null
    }));
};
  
/**
* Process fields object
* @param {Object} fields - Object with fields
* @returns {Array} Structured column data
*/
const processFields = (fields) => {
    const columns = [];
  
    for (const [fieldName, fieldInfo] of Object.entries(fields)) {
      columns.push({
        name: fieldName,
        type: mapDataType(typeof fieldInfo === 'string' ? fieldInfo : fieldInfo.type),
        isPrimary: fieldInfo.primaryKey || fieldInfo.primary || false,
        isNullable: fieldInfo.nullable !== false,
        isUnique: fieldInfo.unique || false,
        defaultValue: fieldInfo.default || fieldInfo.defaultValue,
        // Preserve faker information if it exists
        faker: fieldInfo.faker || null,
        fakerType: fieldInfo.faker ? `${fieldInfo.faker.category}.${fieldInfo.faker.type}` : null
      });
    }
  
    return columns;
};
  
/**
* Process generic object as column set
* @param {Object} obj - Object to process
* @returns {Array} Structured column data
*/
const processGenericObject = (obj) => {
    const columns = [];
  
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('_')) continue;
  
      let columnInfo = {
        name: key,
        type: 'string', 
        isPrimary: false,
        isNullable: true,
        isUnique: false,
        faker: null,
        fakerType: null
      };
  
      if (typeof value === 'string') {
        columnInfo.type = mapDataType(value);
      }
      else if (typeof value === 'object' && value !== null) {
        columnInfo.type = mapDataType(value.type || typeof value);
        columnInfo.isPrimary = value.primaryKey || value.primary || key === 'id';
        columnInfo.isNullable = value.nullable !== false;
        columnInfo.isUnique = value.unique || false;
        columnInfo.defaultValue = value.default || value.defaultValue;
        // Preserve faker information
        columnInfo.faker = value.faker || null;
        columnInfo.fakerType = value.faker ? `${value.faker.category}.${value.faker.type}` : null;
      }
  
      columns.push(columnInfo);
    }
  
    return columns;
};
  
/**
* Detect relations between tables based on naming conventions and structure
* @param {Array} tables - Tables
* @param {Object} schema - Original schema
* @returns {Array} Detected relations
*/
const detectRelations = (tables, schema) => {
    const relations = [];
    const tableMap = new Map(tables.map(table => [table.name, table]));
  
    if (schema.relations && Array.isArray(schema.relations)) {
      for (const relation of schema.relations) {
        relations.push({
          sourceTable: relation.source || relation.from,
          targetTable: relation.target || relation.to,
          sourceColumn: relation.sourceColumn || relation.fromColumn || 'id',
          targetColumn: relation.targetColumn || relation.toColumn,
          relationType: relation.type || 'many-to-one'
        });
      }
    }
  
    for (const table of tables) {
      for (const column of table.columns) {
        if (column.name.endsWith('_id') || column.name.endsWith('Id')) {
          const prefix = column.name.replace(/_id$/i, '').replace(/Id$/i, '');
          
          const possibleTargetTables = [
            prefix, 
            `${prefix}s`,
            `${prefix}es` 
          ];
  
          for (const targetName of possibleTargetTables) {
            if (tableMap.has(targetName)) {
              relations.push({
                sourceTable: table.name,
                targetTable: targetName,
                sourceColumn: column.name,
                targetColumn: 'id', 
                relationType: 'many-to-one'
              });
              break;
            }
          }
        }
      }
    }
  
    return relations;
};
  
/**
* Convert data types from JSON schema to standard DB types
* @param {string} type - Data type from JSON schema
* @returns {string} Standardized data type
*/
const mapDataType = (type) => {
    if (!type) return 'string';
  
    const typeStr = type.toString().toLowerCase();
  
    const typeMap = {
      'string': 'string',
      'text': 'text',
      'number': 'number',
      'integer': 'integer',
      'int': 'integer',
      'float': 'float',
      'double': 'double',
      'decimal': 'decimal',
      'boolean': 'boolean',
      'bool': 'boolean',
      'date': 'date',
      'time': 'time',
      'datetime': 'datetime',
      'timestamp': 'timestamp',
      'json': 'json',
      'array': 'array',
      'object': 'object',
      'binary': 'binary',
      'blob': 'blob',
      'uuid': 'uuid',
      'varchar': 'string'
    };
  
    return typeMap[typeStr] || 'string';
  };
  
  module.exports = {
    analyzeSchema
};