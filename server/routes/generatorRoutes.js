const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const generatorController = require('../controllers/generatorController');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/generator/generate-api
 * @desc    Generate API endpoints based on schema structure
 * @access  Private
 */
router.post(
  '/generate-api',
  auth,
  [
    check('projectId', 'Project ID is required').not().isEmpty()
  ],
  generatorController.generateApi
);

/**
 * @route   POST /api/generator/generate-code
 * @desc    Generate code for endpoints based on schema
 * @access  Private
 */
router.post(
  '/generate-code',
  auth,
  [
    check('projectId', 'Project ID is required').not().isEmpty()
  ],
  generatorController.generateCode
);

module.exports = router;