const { subscriptionTypes, subscriptionLimits, subscriptionFeatures } = require('../utils/subscriptionLimits');
const SchemaFile = require('../models/SchemaFile');
const mongoModelGenerator = require('../services/mongoModelGenerator');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { validationResult } = require('express-validator');
const fakerDataGenerator = require('../services/fakerDataGenerator');

/**
 * Отримання інформації про підписку користувача
 * @route GET /api/generator/subscription/info
 * @access Private
 */
const getSubscriptionInfo = async (req, res) => {
  try {
    const { subscription = 'free', email } = req.user;
    
    return res.status(200).json({
      success: true,
      user: { email },
      subscription: {
        type: subscription,
        tableLimit: subscriptionLimits[subscription] || 3,
        features: subscriptionFeatures[subscription] || subscriptionFeatures.free
      }
    });
  } catch (error) {
    console.error('Помилка отримання інформації про підписку:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при отриманні інформації про підписку' 
    });
  }
};

/**
 * Валідація схеми перед генерацією API
 * @route POST /api/generator/schema/validate
 * @access Private
 */
const validateSubscriptionForSchema = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { subscription = 'free' } = req.user;
    const { schema } = req.body;
    
    if (!schema) {
      return res.status(400).json({
        success: false,
        message: 'Схема обов\'язкова'
      });
    }
    
    const collectionCount = Object.keys(schema).length;
    const tableLimit = subscriptionLimits[subscription] || 3;
    
    if (collectionCount > tableLimit) {
      return res.status(403).json({
        success: false,
        message: `Ваша підписка дозволяє тільки ${tableLimit} таблиць. Будь ласка, оновіть підписку для продовження.`,
        required: {
          tables: collectionCount,
          minimumSubscription: getMinimumSubscriptionRequired(collectionCount)
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Схема валідна для вашої підписки',
      schema: {
        tables: collectionCount,
        tableLimit: tableLimit,
        subscription: subscription
      },
      canProceed: true
    });
  } catch (error) {
    console.error('Помилка валідації схеми для підписки:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при валідації схеми' 
    });
  }
};

/**
 * Генерація API на основі схеми
 * @route POST /api/generator/generate
 * @access Private
 */
const generateApi = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { schemaId, dbType } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        message: 'ID схеми обов\'язковий'
      });
    }
    
    if (!dbType || dbType.toLowerCase() !== 'mongodb') {
      return res.status(400).json({
        success: false,
        message: 'Підтримується тільки тип бази даних MongoDB'
      });
    }

    let schemaAnalysis = req.schemaStructure;
    
    if (!schemaAnalysis) {
      const schema = await SchemaFile.findById(schemaId);
      
      if (!schema) {
        return res.status(404).json({
          success: false,
          message: 'Схему не знайдено'
        });
      }
      
      if (schema.userId.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Доступ заборонено'
        });
      }
      
      schemaAnalysis = schema.structure;
      
      if (!schemaAnalysis || !schemaAnalysis.tables || schemaAnalysis.tables.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Схема не містить таблиць або має неправильний формат'
        });
      }
    }
    
    const { subscription = 'free' } = req.user;
    const tableLimit = subscriptionLimits[subscription] || 3;
    
    if (schemaAnalysis.tables.length > tableLimit) {
      return res.status(403).json({
        success: false,
        message: `Ваша підписка дозволяє тільки ${tableLimit} таблиць. Схема містить ${schemaAnalysis.tables.length} таблиць.`
      });
    }
    
    const generatedFiles = mongoModelGenerator.generateAllFiles(schemaAnalysis);
    
    const timestamp = Date.now();
    const tempDir = path.join(__dirname, '../tmp', `api-${timestamp}`);
    const archiveDir = path.join(__dirname, '../tmp', 'archives');
    const archivePath = path.join(archiveDir, `api-${timestamp}.zip`);

    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'models'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'controllers'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'routes'), { recursive: true });
    
    for (const [filePath, content] of Object.entries(generatedFiles)) {
      const fullPath = path.join(tempDir, filePath);
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content);
    }
    
    console.log(`Згенеровано ${Object.keys(generatedFiles).length} файлів`);
    
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } 
    });

    archive.pipe(output);

    archive.on('error', function(err) {
      console.error('Помилка створення архіву:', err);
      
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Помилка видалення тимчасових файлів:', error);
      }
      
      if (!res.headersSent) {
        return res.status(500).json({ 
          success: false,
          message: 'Помилка створення архіву' 
        });
      }
    });
    
    output.on('close', function() {
      console.log('Архів створено успішно, розмір: ' + archive.pointer() + ' байт');
      
      fs.readFile(archivePath, (err, archiveData) => {
        if (err) {
          console.error('Помилка читання архіву:', err);
          if (!res.headersSent) {
            return res.status(500).json({ 
              success: false,
              message: 'Помилка читання архіву' 
            });
          }
          return;
        }
        
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
          fs.unlinkSync(archivePath);
        } catch (error) {
          console.error('Помилка видалення тимчасових файлів:', error);
        }
        
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename=api-project-${timestamp}.zip`);
          res.setHeader('Content-Length', archiveData.length);
          res.send(archiveData);
        }
      });
    });

    archive.directory(tempDir, false);

    archive.finalize();
    
  } catch (error) {
    console.error('Помилка генерації API:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: 'Помилка сервера при генерації API: ' + error.message
      });
    }
  }
};

/**
 * Парсинг JSON схеми для генерації MongoDB моделей
 * @route POST /api/generator/parse
 * @access Private
 */
const parseJsonSchema = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { schemaId } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        message: 'ID схеми обов\'язковий'
      });
    }
    
    const schema = await SchemaFile.findById(schemaId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        message: 'Схему не знайдено'
      });
    }
    
    if (schema.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }
    
    const schemaAnalysis = schema.structure;
    
    if (!schemaAnalysis || !schemaAnalysis.tables || schemaAnalysis.tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Схема не містить таблиць або має неправильний формат'
      });
    }
    
    const { subscription = 'free' } = req.user;
    const tableLimit = subscriptionLimits[subscription] || 3;
    
    if (schemaAnalysis.tables.length > tableLimit) {
      return res.status(403).json({
        success: false,
        message: `Ваша підписка дозволяє тільки ${tableLimit} таблиць. Схема містить ${schemaAnalysis.tables.length} таблиць.`,
        currentLimit: tableLimit,
        requestedTables: schemaAnalysis.tables.length
      });
    }
    
    const tables = schemaAnalysis.tables.map(table => ({
      name: table.name,
      columnsCount: table.columns.length
    }));
    
    const relations = schemaAnalysis.relations.map(relation => ({
      sourceTable: relation.sourceTable,
      targetTable: relation.targetTable,
      relationType: relation.relationType
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Схема успішно проаналізована',
      schema: {
        tablesCount: tables.length,
        tables,
        relationsCount: relations.length,
        relations
      }
    });
  } catch (error) {
    console.error('Помилка аналізу JSON схеми:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при аналізі схеми' 
    });
  }
};

/**
 * Попередній перегляд згенерованих файлів
 * @route POST /api/generator/preview
 * @access Private
 */
const previewGeneratedFiles = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { schemaId, tableNames } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        message: 'ID схеми обов\'язковий'
      });
    }
    
    const schema = await SchemaFile.findById(schemaId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        message: 'Схему не знайдено'
      });
    }
    
    if (schema.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }
    
    const schemaAnalysis = schema.structure;
    
    if (!schemaAnalysis || !schemaAnalysis.tables || schemaAnalysis.tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Схема не містить таблиць або має неправильний формат'
      });
    }
    
    let tables = schemaAnalysis.tables;
    if (tableNames && Array.isArray(tableNames) && tableNames.length > 0) {
      tables = tables.filter(table => tableNames.includes(table.name));
    }
    
    const previewFiles = {};
    
    if (tables.length > 0) {
      const tableName = tables[0].name;
      previewFiles[`models/${tableName}.js`] = mongoModelGenerator.generateMongooseModel(schemaAnalysis, tableName);
      previewFiles[`controllers/${tableName}Controller.js`] = mongoModelGenerator.generateController(tableName);
      previewFiles[`routes/${tableName}Routes.js`] = mongoModelGenerator.generateRoutes(tableName);
    }
    
    previewFiles['server.js'] = mongoModelGenerator.generateServerFile(
      tables.map(table => table.name)
    );
    
    return res.status(200).json({
      success: true,
      message: 'Попередній перегляд файлів згенеровано',
      files: previewFiles
    });
  } catch (error) {
    console.error('Помилка генерації попереднього перегляду:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при генерації попереднього перегляду' 
    });
  }
};

/**
 * Генерація тестових даних для схеми
 * @route POST /api/generator/generate-data
 * @access Private
 */
const generateTestData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { schemaId, count = 10, locale = 'uk' } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        message: 'ID схеми обов\'язковий'
      });
    }
    
    // Знаходимо схему за ID
    const schema = await SchemaFile.findById(schemaId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        message: 'Схему не знайдено'
      });
    }
    
    if (schema.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }
    
    // Аналіз схеми
    const schemaAnalysis = schema.structure;
    
    if (!schemaAnalysis || !schemaAnalysis.tables || schemaAnalysis.tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Схема не містить таблиць або має неправильний формат'
      });
    }
    
    fakerDataGenerator.setLocale(locale);
    
    const generatedData = fakerDataGenerator.generateDataForAllTables(schemaAnalysis, count);
    
    return res.status(200).json({
      success: true,
      message: 'Тестові дані успішно згенеровано',
      data: generatedData,
      metadata: {
        tablesCount: Object.keys(generatedData).length,
        recordsPerTable: count,
        locale: locale
      }
    });
  } catch (error) {
    console.error('Помилка генерації тестових даних:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при генерації тестових даних' 
    });
  }
};

/**
 * Генерація тестових даних для конкретної таблиці
 * @route POST /api/generator/generate-data/:tableName
 * @access Private
 */
const generateTestDataForTable = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { schemaId, count = 10, locale = 'uk' } = req.body;
    const { tableName } = req.params;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        message: 'ID схеми обов\'язковий'
      });
    }
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Назва таблиці обов\'язкова'
      });
    }
    
    const schema = await SchemaFile.findById(schemaId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        message: 'Схему не знайдено'
      });
    }
    
    if (schema.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }
    
    const schemaAnalysis = schema.structure;
    
    if (!schemaAnalysis || !schemaAnalysis.tables) {
      return res.status(400).json({
        success: false,
        message: 'Схема не містить таблиць або має неправильний формат'
      });
    }
    
    const table = schemaAnalysis.tables.find(t => t.name === tableName);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Таблицю '${tableName}' не знайдено в схемі`
      });
    }
    
    fakerDataGenerator.setLocale(locale);
    
    const generatedData = fakerDataGenerator.generateDocuments(table, count);
    
    return res.status(200).json({
      success: true,
      message: `Тестові дані для таблиці '${tableName}' успішно згенеровано`,
      tableName: tableName,
      data: generatedData,
      metadata: {
        recordsCount: count,
        locale: locale
      }
    });
  } catch (error) {
    console.error('Помилка генерації тестових даних для таблиці:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при генерації тестових даних' 
    });
  }
};

/**
 * Генерація скрипту вставки даних
 * @route POST /api/generator/generate-insert-script
 * @access Private
 */
const generateInsertScript = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { schemaId, count = 10, dbType = 'mongodb', locale = 'uk' } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        message: 'ID схеми обов\'язковий'
      });
    }
    
    const schema = await SchemaFile.findById(schemaId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        message: 'Схему не знайдено'
      });
    }
    
    if (schema.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }
    
    const schemaAnalysis = schema.structure;
    
    if (!schemaAnalysis || !schemaAnalysis.tables || schemaAnalysis.tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Схема не містить таблиць або має неправильний формат'
      });
    }
    
    fakerDataGenerator.setLocale(locale);
    
    const script = fakerDataGenerator.generateInsertScript(schemaAnalysis, dbType, count);
    
    const filename = `${dbType}-insert-script-${Date.now()}.${dbType === 'mongodb' ? 'js' : 'sql'}`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(script);
  } catch (error) {
    console.error('Помилка генерації скрипту:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при генерації скрипту' 
    });
  }
};

module.exports = {
  getSubscriptionInfo,
  validateSubscriptionForSchema,
  parseJsonSchema,
  generateApi,
  previewGeneratedFiles,
  generateTestData,
  generateTestDataForTable,
  generateInsertScript
};