const fs = require('fs');
const path = require('path');
const SchemaFile = require('../models/SchemaFile');
const schemaAnalyzer = require('../services/schemaAnalyzer');
const { validationResult } = require('express-validator');

/**
 * Завантаження JSON файлу зі схемою
 * @route POST /api/schemas/upload
 * @access Private
 */

const uploadSchema = async (req,res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Будь ласка, завантажте JSON файл' });
        }

        const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
        fs.unlinkSync(req.file.path);

        let jsonContent;
        try {
            jsonContent = JSON.parse(fileContent);
        } catch (error) {
            return res.status(400).json({ message: 'Некоректний JSON формат' });
        }

        if (!isValidSchema(jsonContent)) {
            return res.status(400).json({ message: 'Некоректна структура JSON-схеми' });
        }

        const schemaAnalysis = await schemaAnalyzer.analyzeSchema(jsonContent);

        const newSchema = new SchemaFile({
            userId: req.user.userId, 
            filename: req.file.originalname,
            content: fileContent,
            structure: schemaAnalysis, 
            uploadedAt: Date.now()
        });

        await newSchema.save();

        res.status(201).json({
            message: 'Схему успішно завантажено',
            schemaId: newSchema._id,
            tables: schemaAnalysis.tables,
            relations: schemaAnalysis.relations
        });
    } catch (error){   
        console.error('Помилка при завантаженні схеми:', error);
        res.status(500).json({ message: 'Помилка сервера при завантаженні схеми' });
    }
};

/**
 * Отримання всіх схем користувача
 * @route GET /api/schemas
 * @access Private
 */

const getSchemas = async (req, res) => {
    try {
      const schemas = await SchemaFile.find({ userId: req.user.userId })
        .select('_id filename uploadedAt')
        .sort({ uploadedAt: -1 });
  
      res.json(schemas);
    } catch (error) {
      console.error('Помилка при отриманні схем:', error);
      res.status(500).json({ message: 'Помилка сервера при отриманні схем' });
    }
};
  
/**
* Отримання конкретної схеми за ID
* @route GET /api/schemas/:id
* @access Private
*/


const getSchemaById = async (req, res) => {
    try {
      const schema = await SchemaFile.findById(req.params.id);
  
      if (!schema) {
        return res.status(404).json({ message: 'Схему не знайдено' });
      }
  
      if (schema.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Доступ заборонено' });
      }
  
      res.json(schema);
    } catch (error) {
      console.error('Помилка при отриманні схеми:', error);
      res.status(500).json({ message: 'Помилка сервера при отриманні схеми' });
    }
};
  
/**
* Видалення схеми
* @route DELETE /api/schemas/:id
* @access Private
*/

const deleteSchema = async (req, res) => {
    try {
      const schema = await SchemaFile.findById(req.params.id);
  
      if (!schema) {
        return res.status(404).json({ message: 'Схему не знайдено' });
      }
  
      if (schema.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Доступ заборонено' });
      }
  
      await schema.deleteOne();
      res.json({ message: 'Схему успішно видалено' });
    } catch (error) {
      console.error('Помилка при видаленні схеми:', error);
      res.status(500).json({ message: 'Помилка сервера при видаленні схеми' });
    }
};
  
/**
* Базова перевірка валідності JSON-схеми
* В реальному проекті варто використовувати спеціалізовані бібліотеки для валідації
*/

const isValidSchema = (schema) => {
    try {
      if (schema.tables) {
        return Array.isArray(schema.tables);
      }
      
      return typeof schema === 'object' && Object.keys(schema).length > 0;
    } catch (error) {
      return false;
    }
  };
  
  module.exports = {
    uploadSchema,
    getSchemas,
    getSchemaById,
    deleteSchema
};