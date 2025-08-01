const Coupon = require('../models/coupenModel');
const Offer = require('../models/offerModel');
const Category = require('../models/categoryModels');
const Product = require('../models/itemModel')




const getCoupons = async(req,res)=>{
    try{
      const coupons = await Coupon.find().sort({createdAt:-1});
      res.render('admin/coupon/coupons',{coupons});
  
      
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
    console.log(req.body)
    const { code, discountType, discountValue, minOrderAmount, expiryDate } = req.body;
  try {
    await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderAmount,
      expiryDate
    });
    console.log('Hello')
    res.redirect('/admin/coupons');
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


const getOffers  = async(req,res)=>{
  try{
    const offers = await Offer.find()
    .sort({ createdAt: -1 })
    .populate('category');
    res.render('admin/offer/offers',{offers})
  }
   catch(error){
    console.log(error)
   }
}


const addOffer = async(req,res)=>{
  try{
    const categories = await Category.find();
    const products = await Product.find({item_status:true});

    res.render('admin/offer/addOffer',{categories,products})

  }
  catch(error){
    console.log(error)
  }
}

const saveOffer =async(req,res)=>{
  console.log(req.body)

    const { title, description, discountType, discountValue, applicableTo,products, category, startDate, endDate } = req.body;

    try {
      const newOffer = new Offer({
        title,
        description,
        discountType,
        discountValue,
        applicableTo,
        category: applicableTo === 'category' ? category : null,
        products: applicableTo === 'product' ? products : [],
        startDate,
        endDate,
        isActive: true
      });
      
  
      await newOffer.save();
      res.redirect('/admin/offers');
    } catch (err) {
      console.error(err);
      res.redirect('/admin/addOffer');
    }
}

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
  
  