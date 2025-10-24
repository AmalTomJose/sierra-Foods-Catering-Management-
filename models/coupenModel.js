const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code:{type:String,required:true,unique:true},
    discountType:{type:String,enum:['percentage','amount'],required:true},
    discountValue:{type:Number,required:true},
    minOrderAmount:{type:Number,default:0},
    expiryDate:{type:Date,required:true},
    usageLimit:{type:Number,default:1},
    usedBy:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
    createdAt:{type:Date,default:Date.now}
})


module.exports = mongoose.model('Coupon',couponSchema)