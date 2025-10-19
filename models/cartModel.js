const mongoose = require('mongoose');
const {ObjectId} = require('mongodb');
const {Schema } = mongoose;

const cartItemSchema = new Schema({


    product:{
        type:ObjectId,
        ref:'Item',
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    discountedPrice:{
        type:Number,
        default:0
    }

});

const cartSchema = new Schema ({
    user:{
        type:ObjectId,
        ref:'User',
        required:true
    },
    items:[cartItemSchema],
    total:{
        type:Number,
        default:0
    },
    date:{
        type:Date,
        default:Date.now
    }

});


module.exports = mongoose.model('Cart', cartSchema)


