const User = require('../models/User');
const { validationResult } = require('express-validator');
const { 
  subscriptionLimits, 
  subscriptionFeatures, 
  getMinimumSubscriptionRequired 
} = require('../utils/subscriptionLimits');

/**
 * Отримання інформації про підписку користувача
 * @route GET /api/generator/subscription/info
 * @access Private
 */

const getSubscriptionInfo = async (req, res) => {
  try {
    const { subscription = 'free', email } = req.user;
    
    return res.status(200).json({
      success: true,
      user: { email },
      subscription: {
        type: subscription,
        tableLimit: subscriptionLimits[subscription] || 3,
        features: subscriptionFeatures[subscription] || subscriptionFeatures.free
      }
    });
  } catch (error) {
    console.error('Помилка отримання інформації про підписку:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при отриманні інформації про підписку' 
    });
  }
};

/**
 * Валідація схеми перед генерацією API
 * @route POST /api/generator/schema/validate
 * @access Private
 */

const validateSubscriptionForSchema = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { subscription = 'free' } = req.user;
    const { schema } = req.body;
    
    if (!schema) {
      return res.status(400).json({
        success: false,
        message: 'Схема обов\'язкова'
      });
    }
    
    const collectionCount = Object.keys(schema).length;
    const tableLimit = subscriptionLimits[subscription] || 3;
    
    if (collectionCount > tableLimit) {
      return res.status(403).json({
        success: false,
        message: `Ваша підписка дозволяє тільки ${tableLimit} таблиць. Будь ласка, оновіть підписку для продовження.`,
        required: {
          tables: collectionCount,
          minimumSubscription: getMinimumSubscriptionRequired(collectionCount)
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Схема валідна для вашої підписки',
      schema: {
        tables: collectionCount,
        tableLimit: tableLimit,
        subscription: subscription
      },
      canProceed: true
    });
  } catch (error) {
    console.error('Помилка валідації схеми для підписки:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при валідації схеми' 
    });
  }
};

/**
 * Генерація API на основі схеми
 * @route POST /api/generator/generate
 * @access Private
 */

const generateApi = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { subscription = 'free' } = req.user;
    const { schema, dbType } = req.body;
    
    if (!schema) {
      return res.status(400).json({
        success: false,
        message: 'Схема обов\'язкова'
      });
    }
    
    if (!dbType) {
      return res.status(400).json({
        success: false,
        message: 'Тип бази даних обов\'язковий'
      });
    }
    
    if (dbType.toLowerCase() !== 'mongodb') {
      return res.status(400).json({
        success: false,
        message: 'На даний момент підтримується тільки MongoDB'
      });
    }
    
    const collectionCount = Object.keys(schema).length;
    const tableLimit = subscriptionLimits[subscription] || 3;
    
    if (collectionCount > tableLimit) {
      return res.status(403).json({
        success: false,
        message: `Ваша підписка ${subscription} дозволяє створювати тільки ${tableLimit} таблиць. Ви намагаєтесь створити ${collectionCount} таблиць.`,
        currentLimit: tableLimit,
        requestedTables: collectionCount
      });
    }
    
    // Тут буде логіка генерації API на основі схеми
    // Ця частина буде реалізована на наступних кроках
    
    return res.status(200).json({
      success: true,
      message: 'Готово до генерації API',
      validation: {
        tablesCount: collectionCount,
        tablesLimit: tableLimit,
        subscription: subscription
      }
    });
  } catch (error) {
    console.error('Помилка генерації API:', error);
    res.status(500).json({ 
      success: false,
      message: 'Помилка сервера при генерації API' 
    });
  }
};

module.exports = {
  getSubscriptionInfo,
  validateSubscriptionForSchema,
  generateApi
};