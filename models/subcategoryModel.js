const mongoose = require('mongoose');
const {Schema} = mongoose;
const {ObjectId} = require('mongodb')

const subcategorySchema = new Schema ({
    category:{
        type:ObjectId,
        ref:'Category',
        required:true
    },
    subcat_name:{
        type:String,
        required:true
    },
    subcat_status:{
        type:Boolean,
        default:true
    }
})


module.exports = mongoose.model('Subcategory',subcategorySchema);
