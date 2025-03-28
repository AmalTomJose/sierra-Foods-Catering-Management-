const mongoose = require('mongoose');
const {Schema} = mongoose;


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
        required :true,
        unique : false,
        sparse : true,
        default : null
    },
    googleId : {
        type : String,
        unique : true,
        sparse:true
    },
    password : {
        type:String,
        required:true,
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
   }
  
 });

const User = mongoose.model('User',userSchema);

module.exports = User;