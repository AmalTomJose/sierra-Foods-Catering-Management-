const mongoose = require('mongoose');
const {Schema } = mongoose;
const {ObjectId} = require('mongodb');



const wishListItemSchema = new Schema({
    product:{
        type:ObjectId,
        ref:'Item',
        required:true
    }
})



const wishListSchema = new  Schema ({
    user:{
        type:ObjectId,
        ref:'User'
    },
    items:[wishListItemSchema],
    date:{
        type:Date,
        default:Date.now
    }
})


module.exports = mongoose.model('Wishlist',wishListSchema)