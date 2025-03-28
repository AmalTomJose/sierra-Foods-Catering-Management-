const mongoose = require('mongoose');
const {Schema } = mongoose;


const categorySchema = new Schema({
    cat_name:{
        type:String,
        required:true
    },
    cat_status:{
        type:Boolean,
        default:true
    }
})

module.exports = mongoose.model('Category',categorySchema);
