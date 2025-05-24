const mongoose = require('mongoose');

function generateRandomNumberWithPrefix() {
  let prefix = "ODR";
  const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
  const result = `${prefix}${randomNumber}`;
  console.log("random orderid:-", result);
  return result;
}

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    default: generateRandomNumberWithPrefix,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  orderDate: {   
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  coupon: {
    type: String,
  },
  shipping: {
    type: String,
    default: 'Free Shipping',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentStatus:{
    type:String,
    enum:['pending','paid'],
    default:'pending'
    
  },
  createdAt:{
      type:Date,
      default:Date.now
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      
     
    },
  ]
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;