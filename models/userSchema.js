const mongoose = require('mongoose');
const {Schema} = mongoose;
const {ObjectId} = require('mongodb')



const userSchema = new Schema ({
    firstname : {
        type : String,
        required : true
    },
    lastname : {
        type:String,
        required :true
    },
    email : {
        type:String,
        required : true,
        unique: true
    },
    phoneno : {
        type : Number,
        unique : false,
        sparse : true,
        default : null
    },
    image:{
        type:String,
        required:false

    },
    googleId : {
        type : String,
        unique : true,
        sparse:true
    },
    password : {
        type:String,
        unique:false

    },
    isBlocked : {
        type:Number,
        default:0
    },
    isAdmin:{
        type:Number,
        default:0
    },
    isVerified:{
        type:Number,
        default:0
    },
    date : {
        type:Date,
        default:Date.now,  // Add Timestamp
    },
   token:{
    type:String,
    default:''
   },
   referralCode: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
   referredBy:{
    type:ObjectId,
    ref:'User',
    default:null
   }
  
 });

const User = mongoose.model('User',userSchema);

module.exports = User;