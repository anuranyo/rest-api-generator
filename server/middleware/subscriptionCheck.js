const { subscriptionLimits } = require('../utils/subscriptionLimits');

const checkSubscription = async (req, res, next) => {
    try {
        const { subscription = 'free' } = req.user;
        const { schema } = req.body;

        if (!schema) {
            return res.status(400).json({
                success: false,
                message: 'JSON схема обов\'язкова'
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

        next();
    } catch (error){
        console.error('Помилка перевірки підписки:', error);
        res.status(500).json({
          success: false,
          message: 'Внутрішня помилка сервера при перевірці підписки'
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