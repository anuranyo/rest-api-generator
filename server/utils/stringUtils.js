/**
 * Робить першу літеру рядка великою
 * @param {String} str - Вхідний рядок
 * @returns {String} Рядок з великою першою літерою
 */
const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Перетворює рядок в camelCase
 * @param {String} str - Вхідний рядок
 * @returns {String} Рядок в camelCase
 */
const toCamelCase = (str) => {
    if (!str) return '';
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
};

/**
 * Перетворює рядок в PascalCase
 * @param {String} str - Вхідний рядок
 * @returns {String} Рядок в PascalCase
 */
const toPascalCase = (str) => {
    if (!str) return '';
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase();
    }).replace(/\s+/g, '');
};

/**
 * Перетворює рядок в snake_case
 * @param {String} str - Вхідний рядок
 * @returns {String} Рядок в snake_case
 */
const toSnakeCase = (str) => {
    if (!str) return '';
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
};

/**
 * Перетворює рядок з однини в множину (проста реалізація)
 * @param {String} str - Вхідний рядок в однині
 * @returns {String} Рядок у множині
 */
const pluralize = (str) => {
    if (!str) return '';
    
    const irregulars = {
        'person': 'people',
        'child': 'children',
        'man': 'men',
        'woman': 'women',
        'tooth': 'teeth',
        'foot': 'feet',
        'mouse': 'mice',
        'goose': 'geese'
    };
    
    if (irregulars[str.toLowerCase()]) {
        return irregulars[str.toLowerCase()];
    }
    
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
        str.endsWith('ch') || str.endsWith('sh')) {
        return str + 'es';
    } else if (str.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(str.charAt(str.length - 2))) {
        return str.slice(0, -1) + 'ies';
    } else {
        return str + 's';
    }
};

module.exports = {
    capitalizeFirstLetter,
    toCamelCase,
    toPascalCase,
    toSnakeCase,
    pluralize
};