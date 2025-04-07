const multer = require('multer'); 
const express = require('express');
const router = express.Router();
const path = require('path');
const { check } = require('express-validator');
const schemaController = require('../controllers/schemaController');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../tmp/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/json' || path.extname(file.originalname) === '.json') {
        cb(null, true);
    } else {
        cb(new Error('Підтримуються тільки JSON файли'), false)
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // Обмеження розміру файлу (5MB)
    }
});

/**
 * @route   POST /api/schemas/upload
 * @desc    Завантаження нової схеми JSON
 * @access  Private
 */

router.post(
    '/upload',
    auth,
    upload.single('schema'),
    [
      check('schema').custom((value, { req }) => {
        if (!req.file) {
          throw new Error('Файл схеми обов\'язковий');
        }
        return true;
      })
    ],
    schemaController.uploadSchema
);

/**
 * @route   GET /api/schemas
 * @desc    Отримання списку схем JSON
 * @access  Public
 */

router.get('/', auth, schemaController.getSchemas);

/**
 * @route   GET /api/schemas
 * @desc    Отримання конкретної схеми JSON
 * @access  Public
 */

router.get('/:id', auth, schemaController.getSchemaById);

/**
 * @route   DELETE /api/schemas/:id
 * @desc    Видалення схеми
 * @access  Private
 */

router.delete('/:id', auth, schemaController.deleteSchema);

module.exports = router;