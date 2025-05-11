// utils/subscriptionLimits.js
const subscriptionTypes = {
    FREE: 'free',
    BASIC: 'basic',
    PREMIUM: 'premium'
  };
  
  const subscriptionLimits = {
    [subscriptionTypes.FREE]: 3,
    [subscriptionTypes.BASIC]: 5,
    [subscriptionTypes.PREMIUM]: 5
  };
  
  const subscriptionFeatures = {
    [subscriptionTypes.FREE]: {
      maxTables: subscriptionLimits[subscriptionTypes.FREE],
      operations: ['GET', 'POST', 'PUT', 'DELETE'],
      customOperations: false
    },
    [subscriptionTypes.BASIC]: {
      maxTables: subscriptionLimits[subscriptionTypes.BASIC],
      operations: ['GET', 'POST', 'PUT', 'DELETE'],
      customOperations: false
    },
    [subscriptionTypes.PREMIUM]: {
      maxTables: subscriptionLimits[subscriptionTypes.PREMIUM],
      operations: ['GET', 'POST', 'PUT', 'DELETE'],
      customOperations: true
    }
};
  

const getMinimumSubscriptionRequired = (tableCount) => {
    if (tableCount <= subscriptionLimits[subscriptionTypes.FREE]) {
      return subscriptionTypes.FREE;
    } else if (tableCount <= subscriptionLimits[subscriptionTypes.BASIC]) {
      return subscriptionTypes.BASIC;
    } else {
      return subscriptionTypes.PREMIUM;
    }
};
  
module.exports = {
    subscriptionTypes,
    subscriptionLimits,
    subscriptionFeatures,
    getMinimumSubscriptionRequired
};