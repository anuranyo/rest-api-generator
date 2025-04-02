const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApiInstanceSchema = new Schema({
    schemaId: {
        type: Schema.Types.ObjectId,
        ref: 'SchemaFile',
        required: true
    },
    routeMap: {
        type: Object,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ApiInstance', ApiInstanceSchema);
