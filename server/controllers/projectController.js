const Project = require('../models/Project');
const SchemaFile = require('../models/SchemaFile');
const { validationResult } = require('express-validator');

/**
 * Створення нового проекту
 * @route POST /api/projects/create
 * @access Private
 */

const createProject = async (req,res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, apiPrefix, schemaId, settings } = req.body;

        const existingProject = await Project.findOne({ 
            name, 
            userId: req.user.userId 
        });
      
        if (existingProject) {
            return res.status(400).json({ message: 'Проект з такою назвою вже існує' });
        }

        if (schemaId) {
            const schema = await SchemaFile.findById(schemaId);
            if (!schema) {
              return res.status(404).json({ message: 'Схему не знайдено' });
            }
            
            if (schema.userId.toString() !== req.user.userId) {
              return res.status(403).json({ message: 'Доступ до схеми заборонено' });
            }
        }
        
        const newProject = new Project({
            name,
            description,
            userId: req.user.userId,
            apiPrefix: apiPrefix || '/api/v1',
            schemaId,
            settings: settings || {}
        });

        await newProject.save();

        res.status(201).json({
            message: 'Проект успішно створено',
            project: {
                id: newProject._id,
                name: newProject.name,
                description: newProject.description,
                apiPrefix: newProject.apiPrefix,
                schemaId: newProject.schemaId,
                createdAt: newProject.createdAt
            }
        });
    } catch (error){   
        console.error('Помилка створення проекту:', error);
        res.status(500).json({ message: 'Помилка сервера при створенні проекту' });
    }
};

/**
 * Отримання всіх проектів користувача
 * @route GET /api/projects
 * @access Private
 */

const getProjects = async (req, res) => {
    try {
      const projects = await Project.find({ userId: req.user.userId })
        .select('_id name description apiprefix schemaId createdAt')
        .sort({ createdAt: -1 });
  
      res.json(projects);
    } catch (error) {
      console.error('Помилка отримання проектів:', error);
      res.status(500).json({ message: 'Помилка сервера при отриманні проектів' });
    }
};
  
/**
* Отримання конкретного проекту за ID
* @route GET /api/projects/:id
* @access Private
*/

const getProjectById = async (req, res) => {
    try {
      const project = await Project.findById(req.params.id)
        .populate('schemaId', "filename content structure");
  
      if (!project) {
        return res.status(404).json({ message: 'Проект не знайдено' });
      }
  
      if (project.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Доступ заборонено' });
      }
  
      res.json(project);
    } catch (error) {
      console.error('Помилка отримання проекту:', error);
      res.status(500).json({ message: 'Помилка сервера при отриманні проекту' });
    }
};

/**
* Оновлення проекту
* @route UPDATE /api/projects/:id
* @access Private
*/

const updateProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, apiPrefix, schemaId, settings } = req.body;
        
        const project = await Project.findById(req.params.id);
  
        if (!project) {
            return res.status(404).json({ message: 'Проект не знайдено' });
        }
  
        if (project.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Доступ заборонено' });
        }

        if (name && name !== project.name) {
            const existingProject = await Project.findOne({
                name, 
                userId: req.user.userId,
                _id: { $ne: req.params.id}
            });

            if (existingProject) {
                return res.status(400).json({ message: 'Проект з такою назвою вже існує' });
            }
        }

        if (schemaId && schemaId !== project.schemaId?.toString()) {
            const schema = await SchemaFile.findById(schemaId);
            if (!schema) { 
                return res.status(404).json({ message: 'Схему не знайдено' });
            }

            if (schema.userId.toString() !== req.user.userId) {
                return res.status(403).json({ message: 'Доступ до схеми заборонено' });
            }
        }
        
        if (name) project.name = name;
        if (description) project.description = description;
        if (apiPrefix) project.apiPrefix = apiPrefix;
        if (schemaId) project.schemaId = schemaId;
        if (settings) project.settings = settings;

        project.updatedAt = Date.now();

        await project.save();

        res.json({ 
            message: 'Проект успішно оновлено',
            project: {
                id: project._id,
                name: project.name,
                description: project.description,
                apiPrefix: project.apiPrefix,
                schemaId: project.schemaId,
                updatedAt: project.updatedAt
            }
        });
    } catch (error) {
        console.error('Помилка оновлення проекту:', error);
        res.status(500).json({ message: 'Помилка сервера при оновленні проекту' });
    }
};
  
/**
* Видалення проекту
* @route DELETE /api/projects/:id
* @access Private
*/

const deleteProject = async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
  
      if (!project) {
        return res.status(404).json({ message: 'Проект не знайдено' });
      }
  
      if (project.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Доступ заборонено' });
      }
  
      await project.deleteOne();
      res.json({ message: 'Проект успішно видалено' });
    } catch (error) {
      console.error('Помилка при видаленні проекту:', error);
      res.status(500).json({ message: 'Помилка сервера при видаленні проекту' });
    }
};
  
/**
 * Додавання ендпоінту до проекту
 * @route POST /api/projects/:id/endpoints
 * @access Private
 */

const addProjectEndpoint = async (req, res) => {
    try {
      const { method, path, description, parameters, responses } = req.body;

      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: 'Проект не знайдено' });
      }
  
      if (project.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Доступ заборонено' });
      }

      const endpointExists = project.endpoints.some(
        endpoint => endpoint.path === path && endpoint.method === method
      );

      if (endpointExists) {
        return res.status(400).json({
            message: `Ендпоінт ${method} ${path} вже існує в цьому проекті`
        });
      }

      project.endpoints.push({
        method,
        path, 
        description,
        parameters,
        responses
      });

      project.updatedAt = Date.now();
      await project.save();

      res.status(201).json({ 
        message: 'Ендпоінт успішно додано',
        endpoint: project.endpoints[project.endpoints.length - 1]
    });
    } catch (error) {
        console.error('Помилка додавання ендпоінту:', error);
        res.status(500).json({ message: 'Помилка сервера при додаванні ендпоінту' });
    }
  };
  
/**
 * Додавання запису про експорт до проекту
 * @route POST /api/projects/:id/exports
 * @access Private
 */

const addProjectExport = async (req, res) => {
    try {
        const { filename, downloadUrl } = req.body;

        const project = await Project.findById(req.params.id);
      
        if (!project) {
            return res.status(404).json({ message: 'Проект не знайдено' });
        }
    
        if (project.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Доступ заборонено' });
        }

        project.exports.push({
            filename, 
            downloadUrl,
            createdAt: Date.now()
        });

        project.updatedAt = Date.now();
        await project.save();

        res.status(201).json({
            message: 'Запис про експорт успішно додано',
            export: project.exports[project.exports.length - 1]
        });
    } catch (error) {
        console.error('Помилка додавання запису про експорт:', error);
        res.status(500).json({ message: 'Помилка сервера при додаванні запису про експорт' });
    }
} 

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addProjectEndpoint,
    addProjectExport
};