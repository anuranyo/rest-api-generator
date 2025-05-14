const mongoose = require('mongoose');
const stringUtils = require('../utils/stringUtils');

/**
 * Генерує код моделі MongoDB на основі аналізу таблиць
 * @param {Object} schemaAnalysis - Результат аналізу схеми
 * @param {String} tableName - Назва таблиці/колекції
 * @returns {String} Згенерований код моделі
 */
const generateMongooseModel = (schemaAnalysis, tableName) => {
    try {
        const table = schemaAnalysis.tables.find(t => t.name === tableName);
        if (!table) {
            throw new Error(`Таблицю ${tableName} не знайдено в схемі`);
        }

        let modelCode = `const mongoose = require('mongoose');\n`;
        modelCode += `const Schema = mongoose.Schema;\n\n`;
        
        modelCode += `const ${stringUtils.capitalizeFirstLetter(tableName)}Schema = new Schema({\n`;
        
        table.columns.forEach(column => {
            modelCode += `    ${column.name}: {\n`;
            
            modelCode += `        type: ${mapMongooseType(column.type)},\n`;
            
            if (column.isPrimary) {
                 if (column.name !== '_id' && column.name !== 'id') {
                    modelCode += `        unique: true,\n`;
                }
            }
            
            if (column.isUnique) {
                modelCode += `        unique: true,\n`;
            }
            
            if (!column.isNullable) {
                modelCode += `        required: true,\n`;
            }
            
            if (column.defaultValue !== undefined) {
                modelCode += `        default: ${formatDefaultValue(column.defaultValue, column.type)},\n`;
            }
            
            if (column.description) {
                modelCode += `        // ${column.description}\n`;
            }
            
            modelCode += `    },\n`;
        });
        
        modelCode += `    createdAt: {\n`;
        modelCode += `        type: Date,\n`;
        modelCode += `        default: Date.now\n`;
        modelCode += `    },\n`;
        modelCode += `    updatedAt: {\n`;
        modelCode += `        type: Date,\n`;
        modelCode += `        default: Date.now\n`;
        modelCode += `    }\n`;
        modelCode += `});\n\n`;
        
        const tableRelations = schemaAnalysis.relations.filter(
            r => r.sourceTable === tableName || r.targetTable === tableName
        );
        
        if (tableRelations.length > 0) {
            modelCode += `// Індекси для зв'язків\n`;
            
            tableRelations.forEach(relation => {
                if (relation.sourceTable === tableName) {
                    modelCode += `${stringUtils.capitalizeFirstLetter(tableName)}Schema.index({ ${relation.sourceColumn}: 1 });\n`;
                }
            });
            
            modelCode += `\n`;
        }
        
        modelCode += `// Оновлення часової мітки при зміні документа\n`;
        modelCode += `${stringUtils.capitalizeFirstLetter(tableName)}Schema.pre('save', function(next) {\n`;
        modelCode += `    this.updatedAt = Date.now();\n`;
        modelCode += `    next();\n`;
        modelCode += `});\n\n`;
        
        modelCode += `module.exports = mongoose.model('${stringUtils.capitalizeFirstLetter(tableName)}', ${stringUtils.capitalizeFirstLetter(tableName)}Schema);\n`;
        
        return modelCode;
    } catch (error) {
        console.error('Помилка генерації моделі MongoDB:', error);
        throw new Error(`Не вдалося згенерувати модель MongoDB для ${tableName}: ${error.message}`);
    }
};

/**
 * Перетворює типи даних з аналізу схеми у типи Mongoose
 * @param {String} type - Тип даних з аналізу
 * @returns {String} Тип Mongoose
 */
const mapMongooseType = (type) => {
    if (!type) return 'String';
    
    const typeMap = {
        'string': 'String',
        'text': 'String',
        'number': 'Number',
        'integer': 'Number',
        'float': 'Number',
        'double': 'Number',
        'decimal': 'mongoose.Schema.Types.Decimal128',
        'boolean': 'Boolean',
        'bool': 'Boolean',
        'date': 'Date',
        'time': 'Date',
        'datetime': 'Date',
        'timestamp': 'Date',
        'json': 'mongoose.Schema.Types.Mixed',
        'array': 'Array',
        'object': 'mongoose.Schema.Types.Mixed',
        'binary': 'Buffer',
        'blob': 'Buffer',
        'uuid': 'String',
        'objectid': 'mongoose.Schema.Types.ObjectId'
    };
    
    return typeMap[type.toLowerCase()] || 'String';
};

/**
 * Форматує значення за замовчуванням для відповідного типу
 * @param {*} value - Значення за замовчуванням
 * @param {String} type - Тип даних
 * @returns {String} Відформатоване значення
 */
const formatDefaultValue = (value, type) => {
    if (value === null) return 'null';
    
    if (typeof value === 'string') {
        if (type === 'date' || type === 'time' || type === 'datetime' || type === 'timestamp') {
            if (value.toLowerCase() === 'now' || value.toLowerCase() === 'current_timestamp') {
                return 'Date.now';
            }
            return `new Date('${value}')`;
        }
        return `'${value}'`;
    }
    
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    
    return value;
};

/**
 * Генерує CRUD контролер для моделі MongoDB
 * @param {String} modelName - Назва моделі
 * @returns {String} Код контролера
 */
const generateController = (modelName) => {
    const capitalizedName = stringUtils.capitalizeFirstLetter(modelName);
    const camelCaseName = stringUtils.toCamelCase(modelName);
    
    let controllerCode = `const ${capitalizedName} = require('../models/${modelName}');\n`;
    controllerCode += `const { validationResult } = require('express-validator');\n\n`;
    
    controllerCode += `/**\n`;
    controllerCode += ` * Створення нового ${modelName}\n`;
    controllerCode += ` * @route POST /api/${modelName}s\n`;
    controllerCode += ` * @access Public\n`;
    controllerCode += ` */\n`;
    controllerCode += `const create${capitalizedName} = async (req, res) => {\n`;
    controllerCode += `    try {\n`;
    controllerCode += `        const errors = validationResult(req);\n`;
    controllerCode += `        if (!errors.isEmpty()) {\n`;
    controllerCode += `            return res.status(400).json({ errors: errors.array() });\n`;
    controllerCode += `        }\n\n`;
    controllerCode += `        const new${capitalizedName} = new ${capitalizedName}(req.body);\n\n`;
    controllerCode += `        await new${capitalizedName}.save();\n\n`;
    controllerCode += `        res.status(201).json(new${capitalizedName});\n`;
    controllerCode += `    } catch (error) {\n`;
    controllerCode += `        console.error('Помилка створення ${modelName}:', error);\n`;
    controllerCode += `        res.status(500).json({ message: 'Помилка сервера' });\n`;
    controllerCode += `    }\n`;
    controllerCode += `};\n\n`;
    
    controllerCode += `/**\n`;
    controllerCode += ` * Отримання всіх ${modelName}s\n`;
    controllerCode += ` * @route GET /api/${modelName}s\n`;
    controllerCode += ` * @access Public\n`;
    controllerCode += ` */\n`;
    controllerCode += `const getAll${capitalizedName}s = async (req, res) => {\n`;
    controllerCode += `    try {\n`;
    controllerCode += `        const ${camelCaseName}s = await ${capitalizedName}.find();\n`;
    controllerCode += `        res.json(${camelCaseName}s);\n`;
    controllerCode += `    } catch (error) {\n`;
    controllerCode += `        console.error('Помилка отримання ${modelName}s:', error);\n`;
    controllerCode += `        res.status(500).json({ message: 'Помилка сервера' });\n`;
    controllerCode += `    }\n`;
    controllerCode += `};\n\n`;
    
    controllerCode += `/**\n`;
    controllerCode += ` * Отримання ${modelName} за ID\n`;
    controllerCode += ` * @route GET /api/${modelName}s/:id\n`;
    controllerCode += ` * @access Public\n`;
    controllerCode += ` */\n`;
    controllerCode += `const get${capitalizedName}ById = async (req, res) => {\n`;
    controllerCode += `    try {\n`;
    controllerCode += `        const ${camelCaseName} = await ${capitalizedName}.findById(req.params.id);\n\n`;
    controllerCode += `        if (!${camelCaseName}) {\n`;
    controllerCode += `            return res.status(404).json({ message: '${capitalizedName} не знайдено' });\n`;
    controllerCode += `        }\n\n`;
    controllerCode += `        res.json(${camelCaseName});\n`;
    controllerCode += `    } catch (error) {\n`;
    controllerCode += `        console.error('Помилка отримання ${modelName}:', error);\n`;
    controllerCode += `        res.status(500).json({ message: 'Помилка сервера' });\n`;
    controllerCode += `    }\n`;
    controllerCode += `};\n\n`;
    
    controllerCode += `/**\n`;
    controllerCode += ` * Оновлення ${modelName}\n`;
    controllerCode += ` * @route PUT /api/${modelName}s/:id\n`;
    controllerCode += ` * @access Public\n`;
    controllerCode += ` */\n`;
    controllerCode += `const update${capitalizedName} = async (req, res) => {\n`;
    controllerCode += `    try {\n`;
    controllerCode += `        const errors = validationResult(req);\n`;
    controllerCode += `        if (!errors.isEmpty()) {\n`;
    controllerCode += `            return res.status(400).json({ errors: errors.array() });\n`;
    controllerCode += `        }\n\n`;
    controllerCode += `        let ${camelCaseName} = await ${capitalizedName}.findById(req.params.id);\n\n`;
    controllerCode += `        if (!${camelCaseName}) {\n`;
    controllerCode += `            return res.status(404).json({ message: '${capitalizedName} не знайдено' });\n`;
    controllerCode += `        }\n\n`;
    controllerCode += `        ${camelCaseName} = await ${capitalizedName}.findByIdAndUpdate(\n`;
    controllerCode += `            req.params.id,\n`;
    controllerCode += `            { $set: req.body },\n`;
    controllerCode += `            { new: true }\n`;
    controllerCode += `        );\n\n`;
    controllerCode += `        res.json(${camelCaseName});\n`;
    controllerCode += `    } catch (error) {\n`;
    controllerCode += `        console.error('Помилка оновлення ${modelName}:', error);\n`;
    controllerCode += `        res.status(500).json({ message: 'Помилка сервера' });\n`;
    controllerCode += `    }\n`;
    controllerCode += `};\n\n`;
    
    controllerCode += `/**\n`;
    controllerCode += ` * Видалення ${modelName}\n`;
    controllerCode += ` * @route DELETE /api/${modelName}s/:id\n`;
    controllerCode += ` * @access Public\n`;
    controllerCode += ` */\n`;
    controllerCode += `const delete${capitalizedName} = async (req, res) => {\n`;
    controllerCode += `    try {\n`;
    controllerCode += `        const ${camelCaseName} = await ${capitalizedName}.findById(req.params.id);\n\n`;
    controllerCode += `        if (!${camelCaseName}) {\n`;
    controllerCode += `            return res.status(404).json({ message: '${capitalizedName} не знайдено' });\n`;
    controllerCode += `        }\n\n`;
    controllerCode += `        await ${camelCaseName}.deleteOne();\n\n`;
    controllerCode += `        res.json({ message: '${capitalizedName} успішно видалено' });\n`;
    controllerCode += `    } catch (error) {\n`;
    controllerCode += `        console.error('Помилка видалення ${modelName}:', error);\n`;
    controllerCode += `        res.status(500).json({ message: 'Помилка сервера' });\n`;
    controllerCode += `    }\n`;
    controllerCode += `};\n\n`;
    
    controllerCode += `module.exports = {\n`;
    controllerCode += `    create${capitalizedName},\n`;
    controllerCode += `    getAll${capitalizedName}s,\n`;
    controllerCode += `    get${capitalizedName}ById,\n`;
    controllerCode += `    update${capitalizedName},\n`;
    controllerCode += `    delete${capitalizedName}\n`;
    controllerCode += `};\n`;
    
    return controllerCode;
};

/**
 * Генерує маршрути для моделі MongoDB
 * @param {String} modelName - Назва моделі
 * @returns {String} Код маршрутів
 */
const generateRoutes = (modelName) => {
    const capitalizedName = stringUtils.capitalizeFirstLetter(modelName);
    const pluralName = `${modelName}s`; 
    
    let routesCode = `const express = require('express');\n`;
    routesCode += `const router = express.Router();\n`;
    routesCode += `const { check } = require('express-validator');\n`;
    routesCode += `const ${modelName}Controller = require('../controllers/${modelName}Controller');\n\n`;
    
    routesCode += `/**\n`;
    routesCode += ` * @route   POST /api/${pluralName}\n`;
    routesCode += ` * @desc    Створення нового ${modelName}\n`;
    routesCode += ` * @access  Public\n`;
    routesCode += ` */\n`;
    routesCode += `router.post(\n`;
    routesCode += `    '/',\n`;
    routesCode += `    [\n`;
    routesCode += `        // Додайте валідацію відповідно до полів моделі\n`;
    routesCode += `    ],\n`;
    routesCode += `    ${modelName}Controller.create${capitalizedName}\n`;
    routesCode += `);\n\n`;
    
    routesCode += `/**\n`;
    routesCode += ` * @route   GET /api/${pluralName}\n`;
    routesCode += ` * @desc    Отримання всіх ${pluralName}\n`;
    routesCode += ` * @access  Public\n`;
    routesCode += ` */\n`;
    routesCode += `router.get('/', ${modelName}Controller.getAll${capitalizedName}s);\n\n`;
    
    routesCode += `/**\n`;
    routesCode += ` * @route   GET /api/${pluralName}/:id\n`;
    routesCode += ` * @desc    Отримання ${modelName} за ID\n`;
    routesCode += ` * @access  Public\n`;
    routesCode += ` */\n`;
    routesCode += `router.get('/:id', ${modelName}Controller.get${capitalizedName}ById);\n\n`;
    
    routesCode += `/**\n`;
    routesCode += ` * @route   PUT /api/${pluralName}/:id\n`;
    routesCode += ` * @desc    Оновлення ${modelName}\n`;
    routesCode += ` * @access  Public\n`;
    routesCode += ` */\n`;
    routesCode += `router.put(\n`;
    routesCode += `    '/:id',\n`;
    routesCode += `    [\n`;
    routesCode += `        // Додайте валідацію відповідно до полів моделі\n`;
    routesCode += `    ],\n`;
    routesCode += `    ${modelName}Controller.update${capitalizedName}\n`;
    routesCode += `);\n\n`;
    
    routesCode += `/**\n`;
    routesCode += ` * @route   DELETE /api/${pluralName}/:id\n`;
    routesCode += ` * @desc    Видалення ${modelName}\n`;
    routesCode += ` * @access  Public\n`;
    routesCode += ` */\n`;
    routesCode += `router.delete('/:id', ${modelName}Controller.delete${capitalizedName});\n\n`;
    
    routesCode += `module.exports = router;\n`;
    
    return routesCode;
};

/**
 * Генерує основний файл сервера
 * @param {Array} modelNames - Масив назв моделей
 * @returns {String} Код сервера
 */
const generateServerFile = (modelNames) => {
    let serverCode = `const express = require('express');\n`;
    serverCode += `const mongoose = require('mongoose');\n`;
    serverCode += `const cors = require('cors');\n`;
    serverCode += `require('dotenv').config();\n\n`;
    
    serverCode += `const app = express();\n\n`;
    
    serverCode += `// Middleware\n`;
    serverCode += `app.use(express.json());\n`;
    serverCode += `app.use(cors());\n\n`;
    
    serverCode += `// Маршрути\n`;
    modelNames.forEach(modelName => {
        const pluralName = `${modelName}s`;
        serverCode += `app.use('/api/${pluralName}', require('./routes/${modelName}Routes'));\n`;
    });
    serverCode += `\n`;
    
    serverCode += `// Підключення до MongoDB\n`;
    serverCode += `mongoose\n`;
    serverCode += `    .connect(process.env.MONGODB_URI)\n`;
    serverCode += `    .then(() => {\n`;
    serverCode += `        console.log('MongoDB успішно підключено');\n`;
    serverCode += `        \n`;
    serverCode += `        // Запуск сервера\n`;
    serverCode += `        const PORT = process.env.PORT || 5000;\n`;
    serverCode += `        app.listen(PORT, () => {\n`;
    serverCode += `            console.log(\`Сервер запущено на порту \${PORT}\`);\n`;
    serverCode += `        });\n`;
    serverCode += `    })\n`;
    serverCode += `    .catch(err => {\n`;
    serverCode += `        console.error('Помилка підключення до MongoDB:', err);\n`;
    serverCode += `        process.exit(1);\n`;
    serverCode += `    });\n`;
    
    return serverCode;
};

/**
 * Генерує всі необхідні файли для MongoDB API на основі схеми
 * @param {Object} schemaAnalysis - Результат аналізу схеми
 * @returns {Object} Згенеровані файли
 */
const generateAllFiles = (schemaAnalysis) => {
    const files = {};
    const modelNames = schemaAnalysis.tables.map(table => table.name);
    
    schemaAnalysis.tables.forEach(table => {
        files[`models/${table.name}.js`] = generateMongooseModel(schemaAnalysis, table.name);
    });
    
    schemaAnalysis.tables.forEach(table => {
        files[`controllers/${table.name}Controller.js`] = generateController(table.name);
    });
    
    schemaAnalysis.tables.forEach(table => {
        files[`routes/${table.name}Routes.js`] = generateRoutes(table.name);
    });
    
    files['server.js'] = generateServerFile(modelNames);

    files['.env'] = generateEnvFile();
    files['package.json'] = generatePackageJson();
    files['README.md'] = generateReadme(modelNames);
    files['.gitignore'] = generateGitignore();
    
    return files;
};

/**
 * Генерує файл .env з базовою конфігурацією
 * @returns {String} Вміст .env файлу
 */
const generateEnvFile = () => {
  return `# MongoDB Configuration
    MONGODB_URI=mongodb://localhost:27017/your-database-name
    # Alternative for MongoDB Atlas
    # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

    # Server Configuration
    PORT=5000

    # JWT Secret (змініть на свій секретний ключ)
    JWT_SECRET=your-super-secret-jwt-key-change-this

    # Environment
    NODE_ENV=development
    `;
};

/**
 * Генерує файл package.json з необхідними залежностями
 * @param {String} projectName - Назва проекту
 * @returns {String} Вміст package.json
 */
const generatePackageJson = (projectName = 'api-project') => {
  return JSON.stringify({
    name: projectName,
    version: '1.0.0',
    description: 'Generated REST API for MongoDB',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js',
      test: 'echo \"Error: no test specified\" && exit 1'
    },
    keywords: ['api', 'rest', 'mongodb', 'express'],
    author: '',
    license: 'ISC',
    dependencies: {
      express: '^4.18.2',
      mongoose: '^8.0.0',
      cors: '^2.8.5',
      dotenv: '^16.3.1',
      'express-validator': '^7.0.1'
    },
    devDependencies: {
      nodemon: '^3.0.1'
    }
  }, null, 2);
};

/**
 * Генерує README.md файл з інструкціями
 * @param {Array} modelNames - Масив назв моделей
 * @returns {String} Вміст README.md
 */
const generateReadme = (modelNames) => {
  return `# Generated REST API

    This REST API was automatically generated and includes the following models:
    ${modelNames.map(name => `- ${name}`).join('\n')}

    ## Installation

    1. Install dependencies:
    \`\`\`bash
    npm install
    \`\`\`

    2. Configure MongoDB:
    - Update the \`MONGODB_URI\` in the \`.env\` file with your MongoDB connection string

    3. Start the server:
    \`\`\`bash
    npm start
    \`\`\`

    Or for development with auto-reload:
    \`\`\`bash
    npm run dev
    \`\`\`

    ## API Endpoints

    ${modelNames.map(name => `
    ### ${name}

    - \`GET /api/${name.toLowerCase()}s\` - Get all ${name.toLowerCase()}s
    - \`GET /api/${name.toLowerCase()}s/:id\` - Get a specific ${name.toLowerCase()}
    - \`POST /api/${name.toLowerCase()}s\` - Create a new ${name.toLowerCase()}
    - \`PUT /api/${name.toLowerCase()}s/:id\` - Update a ${name.toLowerCase()}
    - \`DELETE /api/${name.toLowerCase()}s/:id\` - Delete a ${name.toLowerCase()}
    `).join('\n')}

    ## Environment Variables

    - \`MONGODB_URI\` - MongoDB connection string
    - \`PORT\` - Server port (default: 5000)
    - \`JWT_SECRET\` - Secret key for JWT tokens (if authentication is implemented)

    ## Project Structure

    \`\`\`
    .
    ├── models/          # Mongoose models
    ├── controllers/     # Route controllers
    ├── routes/          # API routes
    ├── .env             # Environment variables
    ├── server.js        # Server entry point
    ├── package.json     # Project dependencies
    └── README.md        # This file
    \`\`\`
    `;
};

/**
 * Генерує файл .gitignore
 * @returns {String} Вміст .gitignore
 */
const generateGitignore = () => {
  return `# Dependencies
    node_modules/

    # Environment variables
    .env

    # Logs
    logs
    *.log
    npm-debug.log*

    # OS files
    .DS_Store
    Thumbs.db

    # IDE files
    .vscode/
    .idea/

    # Temporary files
    tmp/
    temp/
    `;
};


module.exports = {
    generateMongooseModel,
    generateController,
    generateRoutes,
    generateServerFile,
    generateAllFiles,
    generateEnvFile,
    generatePackageJson,
    generateReadme,
    generateGitignore
};