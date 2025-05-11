/**
* Основна функція аналізу схеми
* @param {Object} schema - JSON схема для аналізу
* @returns {Object} Результати аналізу з таблицями та зв'язками
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
  
      result.relations = detectRelations(result.tables, schema);
  
      return result;
    } catch (error) {
      console.error('Помилка аналізу схеми:', error);
      throw new Error('Помилка під час аналізу JSON-схеми');
    }
};
  
/**
* Витягує інформацію про таблиці з масиву
* @param {Array} tables - Масив таблиць
* @returns {Array} Структуровані дані таблиць
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
          defaultValue: column.defaultValue
        }));
      }
  
      return tableInfo;
    });
};
  
/**
* Витягує інформацію про таблиці з об'єкта
* @param {Object} schema - JSON схема
* @returns {Array} Структуровані дані таблиць
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
* Обробляє масив колонок
* @param {Array} columns - Масив колонок
* @returns {Array} Структуровані дані колонок
*/
const processColumns = (columns) => {
    if (!Array.isArray(columns)) return [];
  
    return columns.map(column => ({
      name: column.name,
      type: mapDataType(column.type),
      isPrimary: column.primaryKey || column.primary || false,
      isNullable: column.nullable !== false,
      isUnique: column.unique || false,
      defaultValue: column.default || column.defaultValue
    }));
};
  
/**
* Обробляє об'єкт полів
* @param {Object} fields - Об'єкт з полями
* @returns {Array} Структуровані дані колонок
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
        defaultValue: fieldInfo.default || fieldInfo.defaultValue
      });
    }
  
    return columns;
};
  
/**
* Обробляє загальний об'єкт як набір колонок
* @param {Object} obj - Об'єкт для обробки
* @returns {Array} Структуровані дані колонок
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
        isUnique: false
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
      }
  
      columns.push(columnInfo);
    }
  
    return columns;
};
  
/**
* Виявляє зв'язки між таблицями на основі конвенцій іменування та структури
* @param {Array} tables - Таблиці
* @param {Object} schema - Оригінальна схема
* @returns {Array} Виявлені зв'язки
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
* Перетворює типи даних з JSON-схеми у стандартні типи БД
* @param {string} type - Тип даних з JSON-схеми
* @returns {string} Стандартизований тип даних
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