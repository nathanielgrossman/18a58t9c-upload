const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  original: String,
  views: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_viewed: {
    type: Date,
    default: Date.now
  },
  color: String
})

module.exports = mongoose.model('Image', imageSchema);