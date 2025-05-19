const mongoose  = require('mongoose');
const {Schema} = mongoose;
const {ObjectId, Timestamp} = require('mongodb');



const bookingSchema = new Schema({
    user:{
        type:ObjectId,
        ref:'User',
        required:true
    },
    eventDate:{
        type:Date,
        required:true
    },
    eventType:{
        type:String,
        enum:['Wedding','Birthday','Corporate','Party'],
        required:true
    },
    guestCount:{
        type:Number,
        enum:[200,400,600,800,1000],
        required:true
    },
    eventPlace:{
        type:String,
        required:true
    },
    eventTime:{
        type:String,
        required:true
    },
    eventDistrict:{
        type:String,
        
    },
    eventPincode:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        enum:['active','cancelled','completed'],
        default:'active'
    },
    cancelReason: {
        type: String,
        default: ''
      },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model('Booking',bookingSchema);   