const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: String,
  description:String,
  discountType: { type: String, enum: ['percentage', 'amount'], required: true },
  discountValue: { type: Number, required: true }, // e.g. 10 (for 10%) or 100 (₹100 off)
  applicableTo: { type: String, enum: ['product', 'category'], required: true },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],  
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // if category-specific
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Offer', offerSchema);
