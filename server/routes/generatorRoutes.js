const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  getSubscriptionInfo, 
  validateSubscriptionForSchema, 
  generateApi 
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
    check('schema').notEmpty().withMessage('Схема обов\'язкова'),
    check('dbType').notEmpty().withMessage('Тип бази даних обов\'язковий'),
    checkSubscription,
    checkDatabaseType
], generateApi);
  
module.exports = router;
