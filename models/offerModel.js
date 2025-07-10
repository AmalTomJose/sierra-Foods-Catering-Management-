const { ServerDescription } = require('mongodb');
const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
    title:String,
    description:String,
    discountType:{type:String,enum:['percentage','amount'],required:true},
    discountValue:Number,
    applicableTo:{type:String,enum:['category','all']},
    category:{type:mongoose.Schema.Types.ObjectId , ref:'Category'},
    startDate:Date,
    endDate:Date,
    isActive:Boolean

});

module.exports = mongoose.model('Offer',offerSchema);