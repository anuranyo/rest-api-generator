const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MockDataSchema = new Schema({
    schemaId: {
        type: Schema.Types.ObjectId,
        ref: 'SchemaFile',
        required: true
    },
    modelName: {
        type: String,
        required: true,
        description: 'Назва моделі (User, Task, ...)'
    },
    records: {
        type: Array,
        required: true,
        description: 'Список згенерованих даних'
    },
    recordCount: {
        type: Number,
        required: true,
        description: 'Скільки штук було згенеровано'
    },
    generatedAt: {
        type: Date,
        default: Date.now,
        description: 'Дата генерації'
    }
});

module.exports = mongoose.model('MockData', MockDataSchema);
