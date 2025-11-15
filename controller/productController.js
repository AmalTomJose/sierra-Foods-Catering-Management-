const Category = require('../models/categoryModels');
const SubCategory = require('../models/subcategoryModel');
const Product = require('../models/itemModel');
const sharp = require('sharp');
const fs = require('fs');

const path = require('path');

// const itemModel = require('../models/itemModel');
const expressEjsLayouts = require('express-ejs-layouts');


//loading products
const loadProducts  = async(req,res)=>{
  try{
    const products = await Product.find();
    const categories = await Category.find()
    const successMessage = req.flash('success');
   
    res.render("admin/product/products", { products,successMessage})
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

const loadeditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findById(id);
    const categories = await Category.find();
    let subcategories = [];

    if (product && product.category) {
      subcategories = await SubCategory.find({ category: product.category });
    }

    if (product) {
      res.render("admin/product/editProduct", {
        categories,
        subcategories,
        product,
        oldData: {},
        error: null,
      });
    } else {
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log("❌ Error loading edit product:", error.message);
    res.status(500).send("Server Error");
  }
};



const loadAddproduct = async (req, res) => {
  try {
    const categories = await Category.find();

    // Always send oldData, even if it's empty
    res.render("admin/product/addproduct", {
      categories,
      productImages: [],
      oldData: {},     // 👈 this fixes the ReferenceError
      error: null,
      success: null
    });

  } catch (error) {
    console.log("Error loading add product page:", error.message);
    res.status(500).send("Server Error");
  }
};



const addProduct = async (req, res) => {
  try {
    const { name, price, discountprice, description, categoryid, subcategoryid } = req.body;
    const imageData = [];
    const oldData = { name, price, discountprice, description, categoryid, subcategoryid };

    // ✅ Validate product name
    const productName = name.trim();
    const validNameRegex = /^[A-Za-z\s]+$/;
    if (!validNameRegex.test(productName)) {
      return res.render("admin/product/addproduct", {
        error: "Product name can only contain letters and spaces.",
        oldData,
      });
    }

    // ✅ Check duplicate product name
    const existingProduct = await Product.findOne({
      item_name: { $regex: new RegExp(`^${productName}$`, "i") },
    });
    if (existingProduct) {
      return res.render("admin/product/addproduct", {
        error: "Product with this name already exists.",
        oldData,
      });
    }

    // ✅ Validate price
    if (price <= 0) {
      return res.render("admin/product/addproduct", {
        error: "Price must be greater than zero.",
        oldData,
      });
    }

    // ✅ Validate discount
    if (discountprice < 0) {
      return res.render("admin/product/addproduct", {
        error: "Discount price cannot be negative.",
        oldData,
      });
    }

    // ✅ Validate images
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.render("admin/product/addproduct", {
          error: "Only PNG, JPEG, and JPG image formats are allowed.",
          oldData,
        });
      }
    }

    // ✅ Image resizing
    for (const file of req.files) {
      const randomInteger = Math.floor(Math.random() * 20000001);
      const imgFileName = "cropped" + randomInteger + ".jpg";
      const imageDirectory = path.join('public', 'admin-assets', 'imgs', 'productIMG');
      const imagePath = path.join(imageDirectory, imgFileName);

      await sharp(file.path)
        .resize({ width: 300, height: 300, fit: 'cover' })
        .toFile(imagePath);

      imageData.push(imgFileName);
    }

    // ✅ Save product
    const newProduct = new Product({
      item_name: productName,
      item_price: price,
      discount_price: discountprice,
      item_description: description,
      category: categoryid,
      subcategory: subcategoryid,
      item_image: imageData,
    });

    await newProduct.save();
    req.flash('success', 'Product added successfully!');
    res.redirect('/admin/products');

  } catch (error) {
    console.error('Error adding product:', error.message);
    res.status(500).send('Error while adding product');
  }
};


const storeEditProduct = async (req, res) => {
  try {
    const {
      product_id,
      name,
      price,
      discountprice,
      description,
      categoryid,
      subcategoryid
    } = req.body;

    const productName = name.trim();
    const product = await Product.findById(product_id);
    const categories = await Category.find();
    const subcategories = await SubCategory.find({ category: categoryid });

    let images = Array.isArray(product.item_image) ? product.item_image : [];

    // --------------------- VALIDATIONS -------------------------

    // Product name validation
    const validNameRegex = /^[A-Za-z\s]+$/;
    if (!validNameRegex.test(productName)) {
      return res.render("admin/product/editProduct", {
        error: "Product name can only contain letters and spaces.",
        oldData: req.body,
        product,
        categories,
        subcategories
      });
    }

    // Price validation
    if (price <= 0) {
      return res.render("admin/product/editProduct", {
        error: "Price must be greater than zero.",
        oldData: req.body,
        product,
        categories,
        subcategories
      });
    }

    // Discount validation
    if (discountprice < 0) {
      return res.render("admin/product/editProduct", {
        error: "Discount price cannot be negative.",
        oldData: req.body,
        product,
        categories,
        subcategories
      });
    }

    // --------------------- HANDLE DELETED IMAGES -------------------------

    let deleteImages = req.body.deleteImages;

    if (deleteImages) {
      if (!Array.isArray(deleteImages)) deleteImages = [deleteImages];

      deleteImages.forEach((filename) => {
        images = images.filter((img) => img !== filename);
      });
    }

    // --------------------- MINIMUM IMAGE VALIDATION -------------------------

    const existingImagesCount = images.length;
    const newImagesCount = req.files?.length || 0;

    const totalImages = existingImagesCount + newImagesCount;

    // ❌ If final images < 3 → not allowed
    if (totalImages < 3) {
      return res.render("admin/product/editProduct", {
        error: "A product must have at least 3 images.",
        oldData: req.body,
        product,
        categories,
        subcategories
      });
    }

    // --------------------- PROCESS NEW IMAGES -------------------------

    if (newImagesCount > 0) {
      for (const file of req.files) {
        const randomInteger = Math.floor(Math.random() * 20000001);
        const imgFileName = `cropped${randomInteger}.jpg`;
        const imagePath = path.join(
          "public",
          "admin-assets",
          "imgs",
          "productIMG",
          imgFileName
        );

        await sharp(file.path)
          .resize({ width: 300, height: 300, fit: "cover" })
          .toFile(imagePath);

        images.push(imgFileName);
      }
    }

    // --------------------- UPDATE DATABASE -------------------------

    await Product.findByIdAndUpdate(product_id, {
      $set: {
        item_name: productName,
        item_price: price,
        discount_price: discountprice,
        item_description: description,
        category: categoryid,
        subcategory: subcategoryid,
        item_image: images,
      },
    });

    req.flash("success", "Product updated successfully!");
    return res.redirect("/admin/products");

  } catch (error) {
    console.error("❌ Error in storeEditProduct:", error);
    res.status(500).send("Error while updating product");
  }
};



const removeImage = async (req, res) => {
  try {
    const { productId, filename } = req.query;

    await Product.findByIdAndUpdate(productId, {
      $pull: { item_image: filename },
    });

    const imagePath = path.join('public', 'admin-assets', 'imgs', 'productIMG', filename);
    await fs.unlink(imagePath);

    res.json({ success: true, message: 'Image removed successfully' });
  } catch (error) {
    console.error('Image removal failed:', error.message);
    res.status(500).json({ success: false, message: 'Failed to remove image' });
  }
};


module.exports = {
    loadAddproduct,
    addProduct,
    loadProducts,
    blockProduct,
    deleteProduct,
    loadeditProduct,
    storeEditProduct,
    removeImage
}