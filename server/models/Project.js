const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  apiPrefix: {
    type: String,
    default: '/api/v1',
    trim: true
  },
  schemaId: {
    type: Schema.Types.ObjectId,
    ref: 'SchemaFile'
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  endpoints: [{
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      required: true
    },
    path: {
      type: String,
      required: true
    },
    description: String,
    parameters: {
        type: mongoose.Schema.Types.Mixed  
    },
    responses: mongoose.Schema.Types.Mixed
  }],
  exports: [{
    filename: String,
    downloadUrl: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Project', ProjectSchema);