const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
    type:String,
    message:String,
    isRead:{type:Boolean,default:false},
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // ✅ Add this
    createdAt:{type:Date,default:Date.now}
})

module.exports = mongoose.model('Notification',notificationSchema)