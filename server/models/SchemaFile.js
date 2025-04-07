const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchemaFileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    structure: mongoose.Schema.Types.Mixed,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SchemaFile', SchemaFileSchema);
