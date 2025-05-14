const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  getSubscriptionInfo, 
  validateSubscriptionForSchema, 
  parseJsonSchema,  
  generateApi,
  previewGeneratedFiles,
  generateTestData,
  generateTestDataForTable,
  generateInsertScript
} = require('../controllers/generatorController');
const { 
  checkSubscription, 
  checkDatabaseType 
} = require('../middleware/subscriptionCheck');
const auth = require('../middleware/auth');

router.get('/test', (req, res) => {
    res.status(200).json({ 
      success: true,
      message: 'API генератора працює' 
    });
});

router.get('/subscription/info', auth, getSubscriptionInfo);

router.post('/schema/validate', [
    auth,
    check('schema').notEmpty().withMessage('Схема обов\'язкова')
], validateSubscriptionForSchema);

router.post('/generate', [
    auth,
    check('schemaId').notEmpty().withMessage('ID схеми обов\'язковий'),
    check('dbType').notEmpty().withMessage('Тип бази даних обов\'язковий'),
    checkSubscription,
    checkDatabaseType
], generateApi);
 
router.post('/parse', [
  auth,
  check('schemaId').notEmpty().withMessage('ID схеми обов\'язковий')
], parseJsonSchema);

router.post('/preview', [
  auth,
  check('schemaId').notEmpty().withMessage('ID схеми обов\'язковий')
], previewGeneratedFiles);

router.post('/generate-data', [
  auth, 
  check('schemaId').notEmpty().withMessage('ID схеми обов\'язковий'),
  check('count').optional().isInt({ min: 1, max: 1000 }).withMessage('Кількість має бути від 1 до 1000'),
  check('locale').optional().isString().withMessage('Локаль має бути рядком')
], generateTestData);

router.post('/generate-data/:tableName', [
  auth, 
  check('schemaId').notEmpty().withMessage('ID схеми обов\'язковий'),
  check('count').optional().isInt({ min: 1, max: 1000 }).withMessage('Кількість має бути від 1 до 1000'),
  check('locale').optional().isString().withMessage('Локаль має бути рядком')
], generateTestDataForTable);

router.post('/generate-insert-script', [
  auth, 
  check('schemaId').notEmpty().withMessage('ID схеми обов\'язковий'),
  check('count').optional().isInt({ min: 1, max: 1000 }).withMessage('Кількість має бути від 1 до 1000'),
  check('dbType').optional().isIn(['mongodb', 'sql']).withMessage('Тип БД має бути mongodb або sql'),
  check('locale').optional().isString().withMessage('Локаль має бути рядком')
], generateInsertScript);

module.exports = router;
