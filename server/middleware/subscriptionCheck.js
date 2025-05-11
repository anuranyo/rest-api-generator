const { subscriptionLimits } = require('../utils/subscriptionLimits');
const SchemaFile = require('../models/SchemaFile');

const checkSubscription = async (req, res, next) => {
  try {
    const { subscription = 'free' } = req.user;
    const { schemaId } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID схеми обов\'язковий' 
      });
    }
    
    const schema = await SchemaFile.findById(schemaId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        message: 'Схему не знайдено'
      });
    }
    
    if (schema.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }
    
    const schemaAnalysis = schema.structure;
    
    if (!schemaAnalysis || !schemaAnalysis.tables) {
      return res.status(400).json({
        success: false,
        message: 'Схема не містить таблиць або має неправильний формат'
      });
    }
    
    req.schemaStructure = schemaAnalysis;
    
    const tablesCount = schemaAnalysis.tables.length;
    
    const tableLimit = subscriptionLimits[subscription] || 3;
    
    if (tablesCount > tableLimit) {
      return res.status(403).json({
        success: false,
        message: `Ваша підписка ${subscription} дозволяє створювати тільки ${tableLimit} таблиць. Ви намагаєтесь створити ${tablesCount} таблиць.`,
        currentLimit: tableLimit,
        requestedTables: tablesCount
      });
    }
    
    next();
  } catch (error) {
    console.error('Помилка перевірки підписки:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при перевірці підписки'
    });
  }
};

const checkDatabaseType = (req, res, next) => {
    const { dbType } = req.body;
  
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
  
  next();
};

module.exports = {
    checkSubscription,
    checkDatabaseType
};