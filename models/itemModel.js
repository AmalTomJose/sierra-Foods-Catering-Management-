const mongoose = require('mongoose');
const subcategoryModel = require('./subcategoryModel');
const {Schema} = mongoose;
const {ObjectId } = require('mongodb')

const itemSchema = new Schema({
    subcategory:{
        type:ObjectId,
        ref:'Subcategory',
        required: true
    },
    item_name:{
        type :  String,
        required : true
    },
    item_description:{
        type :  String,
        required : true
    },
    item_price:{
        type:Number,
        required: true
    },
    item_status:{
        type:Boolean,
        default : true
    },
    item_image:{
        type:Array,
        required:true
    },
    discount_price:{
        type: Number,
        required:true
    },
    productAddDate:{
        type:Date,
        default:Date.now
    },
    stock:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    discout_status:{
        type:Boolean,
        default:false
    },
    dicount:Number,
    discountStart:Date,
    discountEnd:Date
})

module.exports = mongoose.model('Item',itemSchema);
