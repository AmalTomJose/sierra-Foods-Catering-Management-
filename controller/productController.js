const Category = require('../models/categoryModels');
const SubCategory = require('../models/subcategoryModel');
const Product = require('../models/itemModel');
const sharp = require('sharp');
const path = require('path');
const itemModel = require('../models/itemModel');
const expressEjsLayouts = require('express-ejs-layouts');


//loading products
const loadProducts  = async(req,res)=>{
  try{
    const products = await Product.find();
    const categories = await Category.find()
   
    res.render("admin/products", { products, categories })
  }
  catch(error)
  {
    console.lod(error.message)
  }
}
const deleteProduct = async(req,res)=>{
  try{
    const id = req.query.id;
    const deleteproduct = await Product.deleteOne({_id:id});


    res.redirect('/admin/products')

  }
  catch(error)
  {
    console.log(error.message)
  }
}
const blockProduct = async(req,res)=>{
  try{
    const id = req.query.id;

    const newitem = await Product.findById(id);


    if(newitem.item_status)
    {
      const item  = await Product.updateOne({
        _id:id
      },{
        $set:{
          item_status:false

        }
        
      })


    }
    else{
      const item = await Product.updateOne({
        _id:id
      },{
        $set:{
          item_status:true

        }
        
      })
    }
    res.redirect('/admin/products')
    


  }
  catch(error)
  {
    console.log(error.message)
  }
}



const loadAddproduct = async (req,res)=>{
    try{
        res.render('admin/addproduct')

    }
    catch(error){
        console.log(error.message);
    }
}
   

const addProduct = async (req, res) => {
  try {
    console.log(req.body)
    const { name, description, stock, price, discountprice, categoryid, subcategoryid } = req.body;
    const images = req.files; // all images in req.files['images']
    console.log(images)
    const imagePaths = [];
    if (!images || images.length < 3) return res.status(400).send("At least 3 images required");


    // Process and resize each image
    for (let i = 0; i < images.length; i++) {
        const filename = `product-${Date.now()}-${i}.jpeg`;
        const outputPath = path.join("public/admin-assets/imgs/productIMG", filename);
  

        await sharp(images[i].buffer)
        .resize(300, 300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(outputPath);

        imagePaths.push("/admin-assets/imgs/productIMG/" + filename); // Save relative path
    }

    const newProduct = new Product({
      item_name:name,
      item_description: description,
      category: categoryid,
      subcategory: subcategoryid,
      item_image: imagePaths, // assuming your schema expects an array
      item_stock:stock,
      item_price:price,
      discount_price:discountprice
    });
    console.log(newProduct)

    const itemdetails = await newProduct.save();


    
  } 
  catch (error) {
    console.error('Error adding product:', error.message);
    res.status(500).send('Error adding product');
  }
};



module.exports = {
    loadAddproduct,
    addProduct,
    loadProducts,
    blockProduct,
    deleteProduct
}