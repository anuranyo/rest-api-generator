const fs = require('fs');
const path = require('path');
const SchemaFile = require('../models/SchemaFile');
const schemaAnalyzer = require('../services/schemaAnalyzer');
const { validationResult } = require('express-validator');

/**
 * Upload JSON file with schema
 * @route POST /api/schemas/upload
 * @access Private
 */
const uploadSchema = async (req,res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if it's a file upload or direct JSON data
        let fileContent, filename;
        
        if (req.file) {
            // Traditional file upload
            console.log('Uploading file:', req.file); 
            console.log('File path:', req.file.path);

            if (!fs.existsSync(req.file.path)) {
                return res.status(400).json({ message: 'File not found after upload' });
            }

            fileContent = fs.readFileSync(req.file.path, 'utf8');
            filename = req.file.originalname;
            
            // Delete the temporary file
            fs.unlinkSync(req.file.path);
        } else if (req.body.content && req.body.filename) {
            // Direct JSON content from API
            fileContent = req.body.content;
            filename = req.body.filename;
        } else {
            return res.status(400).json({ message: 'Please provide a JSON file or content' });
        }

        let jsonContent;
        try {
            jsonContent = JSON.parse(fileContent);
        } catch (error) {
            return res.status(400).json({ message: 'Invalid JSON format' });
        }

        if (!isValidSchema(jsonContent)) {
            return res.status(400).json({ message: 'Invalid JSON-schema structure' });
        }

        const schemaAnalysis = await schemaAnalyzer.analyzeSchema(jsonContent);

        const newSchema = new SchemaFile({
            userId: req.user.userId, 
            filename: filename,
            content: fileContent,
            structure: schemaAnalysis, 
            uploadedAt: Date.now()
        });

        await newSchema.save();

        res.status(201).json({
            message: 'Schema uploaded successfully',
            schemaId: newSchema._id,
            tables: schemaAnalysis.tables,
            relations: schemaAnalysis.relations
        });
    } catch (error){   
        console.error('Error uploading schema:', error);
        res.status(500).json({ message: 'Server error while uploading schema' });
    }
};

/**
 * Get all user schemas
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
      console.error('Error getting schemas:', error);
      res.status(500).json({ message: 'Server error while getting schemas' });
    }
};
  
/**
* Get specific schema by ID
* @route GET /api/schemas/:id
* @access Private
*/
const getSchemaById = async (req, res) => {
    try {
      const schema = await SchemaFile.findById(req.params.id);
  
      if (!schema) {
        return res.status(404).json({ message: 'Schema not found' });
      }
  
      if (schema.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      res.json(schema);
    } catch (error) {
      console.error('Error getting schema:', error);
      res.status(500).json({ message: 'Server error while getting schema' });
    }
};
  
/**
* Delete schema
* @route DELETE /api/schemas/:id
* @access Private
*/
const deleteSchema = async (req, res) => {
    try {
      const schema = await SchemaFile.findById(req.params.id);
  
      if (!schema) {
        return res.status(404).json({ message: 'Schema not found' });
      }
  
      if (schema.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      await schema.deleteOne();
      res.json({ message: 'Schema deleted successfully' });
    } catch (error) {
      console.error('Error deleting schema:', error);
      res.status(500).json({ message: 'Server error while deleting schema' });
    }
};
  
/**
* Basic JSON-schema validation
* In real project should use specialized libraries for validation
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