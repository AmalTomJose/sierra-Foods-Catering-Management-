const mongoose = require('mongoose');

function generateRandomNumberWithPrefix() {
  let prefix = "ODR";
  const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
  const result = `${prefix}${randomNumber}`;
  console.log("random orderid:-", result);
  return result;
}

const orderSchema = new mongoose.Schema({
  // 🔑 Unique Order ID
  orderId: {
    type: String,
    default: generateRandomNumberWithPrefix,
    unique: true,
  },

  // 👤 User and Booking Info
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },

  // 🧾 Order Details
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      offerDiscount: {
        type: Number,
        default: 0,
      },
      couponDiscount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ['ordered', 'cancelled', 'delivered', 'requested'],
        default: 'ordered',
      },
      refundStatus: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected'],
        default: 'none',
      },
    }
  ],

  // 💰 Price & Discount Summary
  totalAmount: {
    type: Number,
    required: true,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  couponUsed: {
    type: String,
    default: null,
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },

  // 🚚 Shipping & Status
  shipping: {
    type: String,
    default: 'Free Shipping',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'requested', 'approved'],
    default: 'pending',
  },
  cancelReason: {
    type: String,
    default: null,
  },

  // 💳 Payment Details
  paymentMethod: {
    type: String,
    enum: ['cashondelivery', 'wallet', 'online'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid','partial'],
    default: 'pending',
  },
  advanceAmount:{
    type:Number,
    default:0
  },

  // 💸 Refund Status
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected'],
    default: 'none',
  },

  // 📅 Timestamps
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;



// const mongoose = require('mongoose');

// function generateRandomNumberWithPrefix() {
//   let prefix = "ODR";
//   const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
//   const result = `${prefix}${randomNumber}`;
//   console.log("random orderid:-", result);
//   return result;
// }

// const orderSchema = new mongoose.Schema({
//   orderId: {
//     type: String,
//     default: generateRandomNumberWithPrefix,
//     unique: true,
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   },
//   booking: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Booking',
//   },
//   orderDate: {   
//     type: Date,
//     default: Date.now,
//   },
//   deliveryDate: {
//     type: Date,
//   },
//   coupon: {
//     type: String,
//   },
//   shipping: {
//     type: String,
//     default: 'Free Shipping',
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled','requested','approved'],
//     default: 'pending',
//   },
  
//   totalAmount: {
//     type: Number,
//     required: true,
//   },
//   finalAmount:{

//     type:Number,
//     required:true
//   },
//   paymentMethod: {
//     type: String,
//     enum:['cashondelivery','wallet','online'],
//     required: true,
//   },
//   paymentStatus:{
//     type:String,
//     enum:['pending','paid'],
//     default:'pending'
    
//   },
//   cancelReason:{
//     type:String,
//     default:null
//   },
//   refundStatus :{
//     type:String,
//     enum:['none','requested','approved','rejected'],
//     default:'none'
//   },
//   couponUsed:{
//     type:String,
//     default:null
//   },
//   couponDiscount:{
//     type:Number,
//     default:0
//   },

//   createdAt:{
//       type:Date,
//       default:Date.now
//   },
//   items: [
//     {
//       product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Item',
//         required: true,
//       },
//       quantity: { type: Number, required: true },
//       price: { type: Number, required: true },
//       status:{type:String,enum:['ordered','cancelled','delivered','requested'],default:'ordered'},
//       refundStatus:{type:String,enum:['none','requested','approved','rejected'],default:'none'},
//       offerDiscount:{type:Number,default:0},
//       couponDiscount:{type:Number,default:0}
     
//     },  
//   ]
// });

// const Order = mongoose.model('Order', orderSchema);

// module.exports = Order;