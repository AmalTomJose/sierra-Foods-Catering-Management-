const mongoose = require('mongoose');
const SubCategory = require('./subcategoryModel');
const Category = require('../models/categoryModels')
const {Schema} = mongoose;
const {ObjectId } = require('mongodb')

const itemSchema = new Schema({
    
    item_name:{
        type :  String,
        required : true
    },
    item_description:{
        type :  String,
        required : true
    },
     category:{ 
        type : ObjectId,
        ref:'Category',
        required :true

     },
    subcategory:{
        type:ObjectId,
        ref:'Subcategory',
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
    item_stock:{
        type:Number,
        required:true
    },
    item_price:{
        type:Number,
        required: true
    },
    discount_price:{
        type: Number,
        required:true
    },
    productAddDate:{
        type:Date,
        default:Date.now
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
