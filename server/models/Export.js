const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExportSchema = new Schema({
    schemaId: {
        type: Schema.Types.ObjectId,
        ref: 'SchemaFile',
        required: true
    },
    downloadUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Export', ExportSchema);