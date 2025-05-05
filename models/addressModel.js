const mongoose = require('mongoose');
const {Schema} = mongoose;
const {ObjectId} = require('mongodb');


const addressSchema = new  Schema ({
    user:{
        type:ObjectId,
        ref:'User',
        required:true
    },
    housename:{
        type:String
    },
    street:{
        type:String
    },
    city:{
        type: String
    },
    state:{
        type: String
    },
    pincode:{
        type:String
    },
    createdDate:{
        type:Date,
        default:Date.now
    },
    is_listed:{
        type:Boolean,
        default:true
    }
})

module.exports = mongoose.model('Address',addressSchema);
