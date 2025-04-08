const multer = require ('multer');
const path = require('path');

//configuring storage

const storage= multer. memoryStorage();


//filter only image files
const fileFilter = (req,file,cb)=>{
    const allowed = /jpeg|jpg|png|gif/;
    const ext= allowed.test(path.extname(file.originalname).toLowerCase());
    const mime   = allowed.test(file.mimetype);


    if(ext&& mime){
        return cb(null,true);
    }
    else{
        cb('error:ONly  images are allowed!');
    }
    
};
const upload = multer({storage,fileFilter,limits:{files:10}});
module.exports = upload;