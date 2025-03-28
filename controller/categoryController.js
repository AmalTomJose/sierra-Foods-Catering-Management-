const Category = require('../models/categoryModels');
const fs = require('fs');

const Item = require('../models/itemModel')


const loadCategory = async (req,res)=>{
    try{
        const categorydata = await Category.find({});
        res.render('admin/category',{
            categorydata,
            message:''
        })

    }
    catch(error){
        console.log(error.message);
    }
}

const loadItem = async(req,res)=>{
    try{
        const itemdata = await Item.find({});
        
        res.json({'item':itemdata})


    }
    catch(error)
    {
        console.log(error.message)
    }
}



module.exports ={
    loadCategory,
    loadItem
}