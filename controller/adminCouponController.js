const Coupon = require('../models/coupenModel');
const Offer = require('../models/offerModel');
const Category = require('../models/categoryModels');
const Product = require('../models/itemModel');
const { countDocuments } = require('../models/userSchema');




const getCoupons = async(req,res)=>{
    try{
      const page = parseInt(req.query.page)||1;
      const limit =6;
      const skip = (page-1) *limit;
      const search = req.query.search?.trim()||'';

      const searchFilter = search?{code:{$regex:search,$options:"i"}}:{};


     

      const [coupons,total] = await Promise.all([Coupon.find(searchFilter).skip(skip).limit(limit).sort({createdAt:-1}),Coupon.countDocuments(searchFilter)]) 
      if(req.xhr){
        return res.json({
            coupons,
            totalPages : Math.ceil(total/limit),
            currentPage :page

        })


        
      }


      res.render('admin/coupon/coupons',{coupons,
        totalPages:Math.ceil(total/limit),
        currentPage : page
      });
  
      
    }
    catch(error){
      console.log(error)
    }
  }
  
  
  const addCoupon = async (req, res) => {
  
    try {
      res.render('admin/coupon/addCoupon')
    } catch (err) {
      console.error(err);
      res.redirect('/admin/coupons');
    }
  };

  const saveCoupon = async(req,res)=>{
    const { code, discountType, discountValue, minOrderAmount, expiryDate } = req.body;
    couponCode=code.trim().toLowerCase();
    
  try {
    const existingCoupon = await Coupon.findOne({code:{$regex:new RegExp(`^${couponCode}$`,'i')}});

    if(existingCoupon){
      req.flash('error','coupon name already exists')
      
      return    res.render('admin/coupon/addCoupon',{error:'coupon name already exist'});
      
    }
    else{
      await Coupon.create({
        code:couponCode,
        discountType,
        discountValue,
        minOrderAmount,
        expiryDate
      });
req.flash('success','Coupon added')
      res.redirect('/admin/coupons');

    }
   
   
  } catch (err) {
    console.error(err);
  }
  }


  const deleteCoupon = async(req,res)=>{
    try{
      const id = req.params.id;
   await Coupon.findByIdAndDelete(id);
      res.redirect('/admin/coupons')

    }
    catch(error){
       console.log(error)
    }
  }
  const getOffers = async (req, res) => {
    try {
      // Pagination values
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;
  
      // 🔍 Search filter
      const search = req.query.search?.trim() || '';  // <- should be 'search', not 'page'
      const searchFilter = search
        ? { title: { $regex: search, $options: 'i' } }
        : {};
  
      // Fetch offers + total count
      const [offers, total] = await Promise.all([
        Offer.find(searchFilter).sort({createdAt:-1}).skip(skip).limit(limit),
        Offer.countDocuments(searchFilter),
      ]);
  
      const totalPages = Math.ceil(total / limit);
  
      // ✅ Handle AJAX request (for dynamic pagination/search)
      if (req.xhr) {
        return res.json({
          offers,
          totalPages,
          currentPage: page,
        });
      }
  
      // ✅ Render EJS normally
      res.render('admin/offer/offers', {
        offers,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log('Error in getOffers:', error);
    }
  };
  
  const addOffer = async (req, res) => {
    try {
      const categories = await Category.find();
      const products = await Product.find({ item_status: true });
  
      // ✅ Pass empty values so the template doesn't render undefined alerts
      res.render('admin/offer/addOffer', {
        categories,
        products,
        error: '',
        success: ''
      });
  
    } catch (error) {
      console.error('Error loading Add Offer page:', error);
      res.status(500).send('Server Error');
    }
  };
  

const saveOffer = async (req, res) => {
  try {
    let {
      title,
      description,
      discountType,
      discountValue,
      applicableTo,
      products,
      category,
      startDate,
      endDate,
    } = req.body;

    // Normalize data
    title = title?.trim();
    const normalizedTitle = title?.toLowerCase();
    discountValue = Number(discountValue);

    // Re-fetch dropdown data for rerendering
    const categories = await Category.find();
    const productList = await Product.find();

    // --- VALIDATION ---
    if (!title || !description || !discountType || !discountValue || !startDate || !endDate) {
      req.flash("error", "All fields are required");
      return res.render("admin/offer/addOffer", {
        error: "All fields are required",
        categories,
        products: productList,
      });
    }

    // Duplicate check (case-insensitive)
    const existingOffer = await Offer.findOne({
      title: { $regex: new RegExp(`^${normalizedTitle}$`, "i") },
    });

    if (existingOffer) {
      req.flash("error", "Offer title already exists");
      return res.render("admin/offer/addOffer", {
        error: "Offer title already exists",
        categories,
        products: productList,
      });
    }

    // Validate discount range
    if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
      req.flash("error", "Percentage discount must be between 1 and 100");
      return res.render("admin/offer/addOffer", {
        error: "Percentage discount must be between 1 and 100",
        categories,
        products: productList,
      });
    }

    if (discountType === "amount" && discountValue < 1) {
      req.flash("error", "Discount amount must be greater than 0");
      return res.render("admin/offer/addOffer", {
        error: "Discount amount must be greater than 0",
        categories,
        products: productList,
      });
    }

    // Validate date range
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < today.setHours(0, 0, 0, 0)) {
      req.flash("error", "Start date cannot be in the past");
      return res.render("admin/offer/addOffer", {
        error: "Start date cannot be in the past",
        categories,
        products: productList,
      });
    }

    if (end < start) {
      req.flash("error", "End date cannot be before start date");
      return res.render("admin/offer/addOffer", {
        error: "End date cannot be before start date",
        categories,
        products: productList,
      });
    }

    // --- CREATE OFFER ---
    const newOffer = new Offer({
      title: normalizedTitle,
      description,
      discountType,
      discountValue,
      applicableTo,
      category: applicableTo === "category" ? category : null,
      products: applicableTo === "product" ? products : [],
      startDate,
      endDate,
      isActive: true,
    });

    await newOffer.save();
    req.flash("success", "Offer added successfully");
    return res.redirect("/admin/offers");
  } catch (err) {
    console.error("Error saving offer:", err);
    req.flash("error", "Unexpected error while saving the offer");
    return res.redirect("/admin/addOffer");
  }
};

  const deleteOffer = async(req,res)=>{
    try {
      console.log('hii')
      await Offer.findByIdAndDelete(req.params.id);
      res.redirect('/admin/offers');
    } catch (err) {
      console.error(err);
    }
  }



  module.exports = {
    getCoupons,
    addCoupon,
    saveCoupon,
    deleteCoupon,
    getOffers,
    addOffer,
    saveOffer,
    deleteOffer

  }
  
  