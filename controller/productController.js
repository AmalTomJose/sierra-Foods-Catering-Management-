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

    // ✅ Product name validation
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

    // ✅ Price validation
    if (price <= 0) {
      return res.render("admin/product/editProduct", {
        error: "Price must be greater than zero.",
        oldData: req.body,
        product,
        categories,
        subcategories
      });
    }

    // ✅ Discount price validation
    if (discountprice < 0) {
      return res.render("admin/product/editProduct", {
        error: "Discount price cannot be negative.",
        oldData: req.body,
        product,
        categories,
        subcategories
      });
    }

    // ✅ Handle deleted images first
    let deleteImages = req.body.deleteImages;
    if (deleteImages) {
      if (!Array.isArray(deleteImages)) deleteImages = [deleteImages];

      deleteImages.forEach((filename) => {
        images = images.filter((img) => img !== filename);
      });
    }

    // ✅ Validate at least 3 total images after deletion + new uploads
    const existingImagesCount = images.length;
    const newImagesCount = req.files && req.files.length > 0 ? req.files.length : 0;

    if (existingImagesCount + newImagesCount < 3) {
      return res.render("admin/product/editProduct", {
        error: "A product must have at least 3 images. Please upload more images.",
        oldData: req.body,
        product,
        categories,
        subcategories
      });
    }

    // ✅ Process and add new images
    if (newImagesCount > 0) {
      for (const file of req.files) {
        const randomInteger = Math.floor(Math.random() * 20000001);
        const imgFileName = `cropped${randomInteger}.jpg`;
        const imagePath = path.join("public", "admin-assets", "imgs", "productIMG", imgFileName);

        await sharp(file.path)
          .resize({ width: 300, height: 300, fit: "cover" })
          .toFile(imagePath);

        images.push(imgFileName);
      }
    }

    // ✅ Final update to DB
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


// const   storeEditProduct = async (req, res) => {
//   try {
//     console.log(req.body);
//     const product = await Product.findOne({ _id: req.body.product_id });

//     // Ensure product.image is an array, or initialize it as an empty array if not
//     let images = Array.isArray(product.item_image) ? product.item_image : [];

//     let deleteData = [];     

//     const {
//       name,
//       categoryid,
//       subcategoryid,
//       price,
//       discountprice, // Fix typo here
//       description
//     } = req.body;

//     const sizedata = req.body.sizes;

//     // Check if deletecheckbox exists and is truthy before accessing it
//     if (req.body.deletecheckbox) {
//       deleteData = req.body.deletecheckbox;
//       deleteData = deleteData.flat().map(x => Number(x)); // Flatten and convert to numbers
//       images = images.filter((img, idx) => !deleteData.includes(idx));
//     }

//     // If new files are uploaded, process them
//     if (req.files.length != 0) {
//       for (const file of req.files) {
//         console.log(file, "File received");

//         const randomInteger = Math.floor(Math.random() * 20000001);
//         const imageDirectory = path.join('public', 'admin-assets', 'imgs', 'productIMG');
//         const imgFileName = "cropped" + randomInteger + ".jpg";
//         const imagePath = path.join(imageDirectory, imgFileName);

//         console.log(imagePath, "Image path");

//         const croppedImage = await sharp(file.path)
//           .resize({
//             width: 300, 
//             height: 300, 
//             fit: "cover",
//           })
//           .toFile(imagePath);

//         if (croppedImage) {
//           images.push(imgFileName);
//         }
//       }
//     }

//     await Product.findByIdAndUpdate(
//       { _id: req.body.product_id },
//       {
//         $set: {
//           item_name:name,
//           category: categoryid,  // Corrected typo here
//           subcategory: subcategoryid,  // Corrected typo here
//           item_price:price,
//           discount_price: discountprice, // Corrected typo here
//           item_description:description,
//           item_image: images
//         },
//       }
//     );

//     res.redirect("/admin/products");

//   } catch (error) {
//     console.log(error.message);
//   }
// };



// const addProduct = async (req, res) => {
//   try {
//     console.log(req.body)
//     const { name, description,price, discountprice, categoryid, subcategoryid } = req.body;
//     const images = req.files; // all images in req.files['images']
//     console.log(images)
//     const imagePaths = [];
//     if (!images || images.length < 3) return res.status(400).send("At least 3 images required");


//     // Process and resize each image
//     for (let i = 0; i < images.length; i++) {
//         const filename = `product-${Date.now()}-${i}.jpeg`;
//         const outputPath = path.join("public/admin-assets/imgs/productIMG", filename);
  

//         await sharp(images[i].buffer)
//         .resize(300, 300)
//         .toFormat("jpeg")
//         .jpeg({ quality: 90 })
//         .toFile(outputPath);

//         imagePaths.push("/admin-assets/imgs/productIMG/" + filename); // Save relative path
//     }

//     const newProduct = new Product({
//       item_name:name,
//       item_description: description,
//       category: categoryid,
//       subcategory: subcategoryid,
//       item_image: imagePaths, // assuming your schema expects an array
//       item_price:price,
//       discount_price:discountprice
//     });
//     console.log(newProduct)

//     const itemdetails = await newProduct.save();
//     res.redirect('/admin/products')


    
//   } 
//   catch (error) {
//     console.error('Error adding product:', error.message);
//     res.status(500).send('Error adding product');
//   }
// };


// const removeImage = async (req, res) => {
//   try {
//       const productId = req.query.productId;
//       const filename = req.query.filename;
//       await Product.findByIdAndUpdate(productId, {
//           $pull: { item_image: req.query.filename }
//       });
//       const imagePath = path.join('public', 'admin-assets', 'imgs', 'productIMG', filename);
//       await fs.unlink(imagePath);
//       console.log('Image removed successfully');
//       res.json({ success: true, message: 'Image removed successfully' });
//   } catch (error) {
//       console.error(error.message);
//       res.status(500).json({ success: false, message: 'Failed to remove image' });
//   }
// };

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