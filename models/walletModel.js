const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        default: ''
      },
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);
