const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

const projectValidation = [
    check('name', 'Назва проекту обов\'язкова').not().isEmpty(),
    check('name', 'Назва проекту повинна бути від 3 до 50 символів').isLength({ min: 3, max: 50 }),
    check('apiPrefix', 'Префікс API повинен починатися з /').optional().custom(value => {
        if (value && !value.startsWith('/')) {
            throw new Error('Префікс API повинен починатися з /');
        }
        return true;
    })
];

const endpointValidation = [
    check('method', 'Метод HTTP обов\'язковий').not().isEmpty(),
    check('method', 'Метод HTTP повинен бути одним з: GET, POST, PUT, DELETE').isIn(['GET', 'POST', 'PUT', 'DELETE']),
    check('path', 'Шлях ендпоінту обов\'язковий').not().isEmpty(),
    check('path', 'Шлях ендпоінту повинен починатися з /').custom(value => {
      if (!value.startsWith('/')) {
        throw new Error('Шлях ендпоінту повинен починатися з /');
      }
      return true;
    })
];

const exportValidation = [
    check('filename', 'Назва файлу обов\'язкова').not().isEmpty(),
    check('downloadUrl', 'URL для завантаження обов\'язковий').not().isEmpty()
];

/**
 * @route   POST /api/projects
 * @desc    Створення нового проекту
 * @access  Private
 */

router.post(
    '/',
    auth,
    projectValidation,
    projectController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Отримання списку проектів користувача
 * @access  Private
 */

router.get('/', auth, projectController.getProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Отримання проекту за ID 
 * @access  Private
 */

router.get('/:id', auth, projectController.getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Оновлення проекту
 * @access  Private
 */

router.put('/:id', auth, projectValidation, projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Видалення проекту
 * @access  Private
 */

router.delete('/:id', auth, projectController.deleteProject);

// @route   POST /api/projects/:id/endpoints
// @desc    Додавання ендпоінту до проекту
// @access  Private

router.post('/:id/endpoints', auth, endpointValidation, projectController.addProjectEndpoint)

// @route   POST /api/projects/:id/exports
// @desc    Додавання запису про експорт до проекту
// @access  Private

router.post('/:id/exports', auth, exportValidation, projectController.addProjectExport)

module.exports = router;