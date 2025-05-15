const { faker } = require('@faker-js/faker');

/**
 * Generate data according to field type
 * @param {String} dataType - Data type
 * @param {String} fieldName - Field name (can influence generator choice)
 * @returns {*} Generated data
 */
const generateDataByType = (dataType, fieldName = '') => {
  const lowerFieldName = fieldName.toLowerCase();
  
  if (lowerFieldName.includes('email')) return faker.internet.email();
  if (lowerFieldName.includes('phone')) return faker.phone.number();
  if (lowerFieldName.includes('name')) {
    if (lowerFieldName.includes('first')) return faker.person.firstName();
    if (lowerFieldName.includes('last')) return faker.person.lastName();
    if (lowerFieldName.includes('full')) return faker.person.fullName();
    return faker.person.firstName();
  }
  if (lowerFieldName.includes('age')) return faker.number.int({ min: 18, max: 85 });
  if (lowerFieldName.includes('address')) return faker.location.streetAddress();
  if (lowerFieldName.includes('city')) return faker.location.city();
  if (lowerFieldName.includes('country')) return faker.location.country();
  if (lowerFieldName.includes('title')) return faker.lorem.sentence();
  if (lowerFieldName.includes('content') || lowerFieldName.includes('description')) {
    return faker.lorem.paragraphs();
  }
  if (lowerFieldName.includes('date')) return faker.date.recent();
  if (lowerFieldName.includes('created')) return faker.date.past();
  if (lowerFieldName.includes('updated')) return faker.date.recent();
  if (lowerFieldName.includes('image') || lowerFieldName.includes('avatar')) {
    return faker.image.url();
  }
  if (lowerFieldName.includes('url') || lowerFieldName.includes('website')) {
    return faker.internet.url();
  }
  if (lowerFieldName.includes('username')) return faker.internet.userName();
  if (lowerFieldName.includes('password')) return faker.internet.password();
  if (lowerFieldName.includes('price') || lowerFieldName.includes('amount')) {
    return parseFloat(faker.commerce.price());
  }
  if (lowerFieldName.includes('product')) return faker.commerce.productName();
  if (lowerFieldName.includes('company')) return faker.company.name();
  if (lowerFieldName.includes('job')) return faker.person.jobTitle();
  if (lowerFieldName.includes('salary')) return faker.number.int({ min: 30000, max: 150000 });
  if (lowerFieldName.includes('rating')) return faker.number.int({ min: 1, max: 5 });
  if (lowerFieldName.includes('count') || lowerFieldName.includes('quantity')) {
    return faker.number.int({ min: 0, max: 100 });
  }
  if (lowerFieldName.includes('status')) {
    return faker.helpers.arrayElement(['active', 'inactive', 'pending', 'completed']);
  }
  if (lowerFieldName.includes('category')) {
    return faker.commerce.department();
  }
  if (lowerFieldName.includes('tag')) {
    return faker.word.noun();
  }
  
  if (lowerFieldName.includes('id')) {
    if (lowerFieldName.includes('author') || 
        lowerFieldName.includes('user') || 
        lowerFieldName.includes('post') || 
        lowerFieldName.includes('category') ||
        lowerFieldName.includes('product') ||
        lowerFieldName.includes('order') ||
        lowerFieldName.includes('comment') ||
        lowerFieldName.includes('review') ||
        lowerFieldName.includes('parent') ||
        lowerFieldName.includes('customer') ||
        lowerFieldName.includes('employee')) {
      return faker.database.mongodbObjectId();
    }
  }
  
  switch (dataType) {
    case 'string':
    case 'text':
      return faker.lorem.word();
    case 'number':
    case 'integer':
      return faker.number.int({ min: 1, max: 1000 });
    case 'float':
    case 'double':
    case 'decimal':
      return faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });
    case 'boolean':
    case 'bool':
      return faker.datatype.boolean();
    case 'date':
    case 'time':
    case 'datetime':
    case 'timestamp':
      return faker.date.recent();
    case 'uuid':
      return faker.string.uuid();
    case 'objectid':
      return faker.database.mongodbObjectId();
    case 'array':
      return [faker.lorem.word(), faker.lorem.word()];
    case 'json':
    case 'object':
      return {
        key: faker.lorem.word(),
        value: faker.lorem.word()
      };
    default:
      return faker.lorem.word();
  }
};

/**
 * Generate data for Faker types (person.fullName, internet.email etc)
 * @param {String} fakerType - Faker type in format "category.method"
 * @returns {*} Generated data
 */
const generateDataByFakerType = (fakerType) => {
  try {
    const [category, method] = fakerType.split('.');
    
    if (!category || !method) {
      console.warn(`Invalid Faker type format: ${fakerType}`);
      return faker.lorem.word();
    }
    
    if (faker[category] && typeof faker[category][method] === 'function') {
      return faker[category][method]();
    } else {
      console.warn(`Faker method not found: ${fakerType}`);
      return faker.lorem.word();
    }
  } catch (error) {
    console.error(`Error generating data for type ${fakerType}:`, error);
    return faker.lorem.word();
  }
};

/**
 * Generate single document based on collection structure
 * @param {Object} tableStructure - Table/collection structure
 * @returns {Object} Generated document
 */
const generateSingleDocument = (tableStructure) => {
  const document = {};
  
  for (const column of tableStructure.columns) {
    // Skip certain fields
    if (column.name === '_id') continue;
    if (column.name === 'createdAt' || column.name === 'updatedAt') continue;
    
    // Use faker configuration if available
    if (column.faker && column.faker.active !== false) {
      const fakerType = `${column.faker.category}.${column.faker.type}`;
      document[column.name] = generateDataByFakerType(fakerType);
    } 
    // Use fakerType if it's directly provided
    else if (column.fakerType) {
      document[column.name] = generateDataByFakerType(column.fakerType);
    }
    // Fall back to type-based generation
    else if (column.type && column.type.includes('.')) {
      document[column.name] = generateDataByFakerType(column.type);
    } 
    else {
      document[column.name] = generateDataByType(column.type, column.name);
    }
  }
  
  return document;
};

/**
 * Generate array of documents for collection
 * @param {Object} tableStructure - Table/collection structure
 * @param {Number} count - Number of documents to generate
 * @returns {Array} Array of generated documents
 */
const generateDocuments = (tableStructure, count = 10) => {
  const documents = [];
  
  for (let i = 0; i < count; i++) {
    documents.push(generateSingleDocument(tableStructure));
  }
  
  return documents;
};

/**
 * Generate data for all tables in schema
 * @param {Object} schemaAnalysis - Schema analysis result
 * @param {Number} countPerTable - Number of documents per table
 * @returns {Object} Object with data for each table
 */
const generateDataForAllTables = (schemaAnalysis, countPerTable = 10) => {
  const data = {};
  
  for (const table of schemaAnalysis.tables) {
    data[table.name] = generateDocuments(table, countPerTable);
  }
  
  return data;
};

/**
 * Generate SQL or MongoDB script for data insertion
 * @param {Object} schemaAnalysis - Schema analysis result
 * @param {String} dbType - Database type (mongodb/sql)
 * @param {Number} countPerTable - Number of records per table
 * @returns {String} Data insertion script
 */
const generateInsertScript = (schemaAnalysis, dbType = 'mongodb', countPerTable = 10) => {
  const data = generateDataForAllTables(schemaAnalysis, countPerTable);
  let script = '';
  
  if (dbType === 'mongodb') {
    for (const [tableName, documents] of Object.entries(data)) {
      script += `// Insert data for ${tableName} collection\n`;
      script += `db.${tableName}.insertMany([\n`;
      
      documents.forEach((doc, index) => {
        doc._id = faker.database.mongodbObjectId();
        script += '  ' + JSON.stringify(doc, null, 2).replace(/\n/g, '\n  ');
        if (index < documents.length - 1) script += ',';
        script += '\n';
      });
      
      script += ']);\n\n';
    }
  } else {
    for (const [tableName, documents] of Object.entries(data)) {
      script += `-- Insert data for ${tableName} table\n`;
      
      documents.forEach(doc => {
        const columns = Object.keys(doc).join(', ');
        const values = Object.values(doc).map(value => {
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString()}'`;
          if (value === null) return 'NULL';
          return value;
        }).join(', ');
        
        script += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
      });
      
      script += '\n';
    }
  }
  
  return script;
};

/**
 * Set data generation language
 * @param {String} locale - Language code (uk, en, de etc)
 */
const setLocale = (locale = 'en') => {
  faker.locale = locale;
};

module.exports = {
  generateDataByType,
  generateDataByFakerType,
  generateSingleDocument,
  generateDocuments,
  generateDataForAllTables,
  generateInsertScript,
  setLocale
};