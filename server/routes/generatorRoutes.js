const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  getSubscriptionInfo, 
  validateSubscriptionForSchema, 
  parseJsonSchema,  
  generateApi,
  previewGeneratedFiles
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

module.exports = router;
