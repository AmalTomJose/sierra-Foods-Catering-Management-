const mongoose = require('mongoose');
const {Schema } = mongoose;
const {ObjectId} = require('mongodb');



const dailyCountSchema = new Schema ({
    date:{
        type:Date,
        unique:true,
        required:true
    },
    totalBookings: {
      type: Number,
      default: 0
    },
    totalGuests:{
        type:Number,
        default:0
    }
});


module.exports = mongoose.model('DailyCount',dailyCountSchema);