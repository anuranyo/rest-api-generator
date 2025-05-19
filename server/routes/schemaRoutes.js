const multer = require('multer'); 
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { check } = require('express-validator');
const schemaController = require('../controllers/schemaController');
const auth = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../tmp/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Створено директорію для завантажень: ${uploadsDir}`);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/json' || path.extname(file.originalname) === '.json') {
        cb(null, true);
    } else {
        cb(new Error('Only JSON files supported'), false)
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 
    }
});

/**
 * @route   POST /api/schemas/upload
 * @desc    Upload new JSON schema (file or direct JSON)
 * @access  Private
 */
router.post(
    '/upload',
    auth,
    (req, res, next) => {
      // Check if request has JSON content in body
      if (req.is('application/json') && req.body.content) {
        // Direct JSON upload, skip multer
        return next();
      }
      // Otherwise, use multer for file upload
      upload.single('schema')(req, res, next);
    },
    [
      check('').custom((value, { req }) => {
        // Check for either file upload or direct JSON content
        if (!req.file && (!req.body.content || !req.body.filename)) {
          throw new Error('Schema file or content required');
        }
        return true;
      })
    ],
    schemaController.uploadSchema
);

/**
 * @route   GET /api/schemas
 * @desc    Get list of JSON schemas
 * @access  Private
 */
router.get('/', auth, schemaController.getSchemas);

/**
 * @route   GET /api/schemas/:id
 * @desc    Get specific JSON schema
 * @access  Private
 */
router.get('/:id', auth, schemaController.getSchemaById);

/**
 * @route   DELETE /api/schemas/:id
 * @desc    Delete schema
 * @access  Private
 */
router.delete('/:id', auth, schemaController.deleteSchema);

module.exports = router;