const Cart  = require('../models/cartModel');
const User = require('../models/userSchema');
const Product = require('../models/itemModel');
const Booking = require('../models/bookingModel')
const Offer = require('../models/offerModel');
const Wishlist = require('../models/wishlistModel');
const { min } = require('moment');



const loadCart = async (req, res) => {
  try {
    const user = req.session.user_id;

    const userCart = await Cart.findOne({ user }).populate("items.product");

    if (!userCart || userCart.items.length === 0) {
      return res.render("user/product/cart", {
        user,
        cart: [],
        productTotal: [],
        subtotalWithShipping: 0,
        qty: 0,
        offerDiscount: 0,
        totalAfterOffer: 0
      });
    }

    const cart = userCart.items;

    // 🧾 Get most recent booking (guest count)
    const booking = await Booking.findOne({ user })
      .sort({ createdAt: -1 })
      .select("guestCount");

    if (!booking) return res.redirect("/eventDetails");

    const guestCount = booking.guestCount;
    const minQty = Math.floor(guestCount / 2);
    const maxQty = guestCount;

    console.log('minQty  is:',minQty);

    // 🎯 Fetch active offers
    const activeOffers = await Offer.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      isActive: true,
    });

    let subtotal = 0;
    let offerDiscount = 0;
    const productTotal = [];

    const cartItemsWithDiscount = cart.map(item => {
      const product = item.product;
      const quantity = item.quantity;

      // 🔎 Match offers
      const productOffer = activeOffers.find(o =>
        o.applicableTo === "product" &&
        Array.isArray(o.products) &&
        o.products.some(pid => pid.toString() === product._id.toString())
      );

      const categoryOffer = activeOffers.find(
        o => o.applicableTo === "category" &&
        o.category?.toString() === product.category?._id?.toString()
      );

      const globalOffer = activeOffers.find(o => o.applicableTo === "all");

      // ⚙️ Choose best offer
      let bestOffer = null;
      let bestDiscount = 0;
      const offers = [productOffer, categoryOffer, globalOffer];
      for (const offer of offers) {
        if (!offer) continue;
        const discount = calculateOffer(offer, product.item_price);
        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestOffer = offer;
        }
      }

      const discountedPrice = Math.max(product.item_price - bestDiscount, 0);
      const totalForItem = discountedPrice * quantity;

      subtotal += totalForItem;
      offerDiscount += bestDiscount * quantity;
      productTotal.push(totalForItem);

      return {
        ...item._doc,
        discountedPrice,
        offerApplied: bestDiscount,
        appliedOffer: bestOffer,
      };
    });

    const shipping = 0;
    const subtotalWithShipping = subtotal + shipping;

    // 🚫 Validate cart item quantity range (min–max)
    for (let item of cart) {
      if (item.quantity < minQty) {
        return res.render("user/product/cart", {
          user,
          cart: cartItemsWithDiscount,
          productTotal,
          subtotalWithShipping: 0,
          minQty,
          maxQty,
          qty: guestCount,
          offerDiscount,
          totalAfterOffer: 0,
          error: `Minimum quantity for ${item.product.item_name} is ${minQty} (based on ${guestCount} guests).`,
        });
      }
      if (item.quantity > maxQty) {
        return res.render("user/product/cart", {
          user,
          cart: cartItemsWithDiscount,
          productTotal,
          subtotalWithShipping: 0,
          minQty,
          maxQty,
          qty: guestCount,
          offerDiscount,
          totalAfterOffer: 0,
          error: `Quantity for ${item.product.item_name} cannot exceed ${maxQty} (guest count).`,
        });
      }
    }

    // 🧾 Render cart with all calculations
    res.render("user/product/cart", {
      user,
      cart: cartItemsWithDiscount,
      productTotal,
      subtotalWithShipping,
      minQty,
          maxQty,
      qty: guestCount,
      offerDiscount,
      totalAfterOffer: subtotalWithShipping,
      minQty,
      maxQty
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// 💡 Utility Function
function calculateOffer(offer, price) {
  if (!offer) return 0;
  if (offer.discountType === "percentage") {
    return Math.round((price * offer.discountValue) / 100);
  }
  return offer.discountValue;
}





const addtoCart = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const { productId, qty } = req.body;
  
      // Validate input
      if (!productId || !qty  ) {
        return res.status(400).json({ success: false, error: "Invalid input data" });
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
  
      let existingCart = await Cart.findOne({ user: userId });
  
      if (!existingCart) {
        // Create new cart if none exists
        existingCart = new Cart({
          user: userId,
          items: [{ product: productId, quantity: parseInt(qty, 10) }],
          total: parseInt(qty, 10),
        });
      } else {
        // Check if product already in cart
        const existingItem = existingCart.items.find(
          (item) => item.product.toString() === productId
        );
  
        if (existingItem) {
          
          return res.json({ success: false, error: 'Product already in cart!' });
        } else {
          existingCart.items.push({ product: productId, quantity: parseInt(qty, 10) });
          existingCart.total += parseInt(qty, 10);
        }
      }
  
      await existingCart.save();
      await  Wishlist.updateOne({user:userId},{$pull:{items:{product:productId}}});
      return res.json({ success: true, message: 'Product added to cart successfully!' });
  
    } catch (error) {
      console.error('Add to Cart Error:', error.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  
const removeCart = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;
    
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
          cart.items = cart.items.filter(item => item.product.toString() !== productId);
          await cart.save();
          return res.json({ success: true });
        }
        res.json({ success: false });
      } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
      }
    }

    const updateCart = async (req, res) => {
      try {
        const userId = req.session.user_id;
        const { productId, quantity } = req.body;
        const newQuantity = parseInt(quantity);
    
        if (!userId || !productId || isNaN(newQuantity)) {
          return res.json({ success: false, error: "Invalid input." });
        }
    
        // ✅ Get user's latest booking to calculate limits
        const booking = await Booking.findOne({ user: userId })
          .sort({ createdAt: -1 })
          .select("guestCount");
    
        if (!booking) {
          return res.json({ success: false, error: "Please enter event details before updating cart." });
        }
    
        const guestCount = booking.guestCount;
        const minQty = Math.floor(guestCount / 2);
        const maxQty = guestCount;
    
        // ✅ Validate limits
        if (newQuantity < minQty) {
          return res.json({
            success: false,
            error: `Minimum quantity is ${minQty} based on ${guestCount} guests.`,
          });
        }
        if (newQuantity > maxQty) {
          return res.json({
            success: false,
            error: `Quantity cannot exceed ${maxQty} (guest count).`,
          });
        }
    
        // ✅ Find and update quantity
        const cart = await Cart.findOneAndUpdate(
          { user: userId, "items.product": productId },
          { $set: { "items.$.quantity": newQuantity } },
          { new: true }
        ).populate("items.product");
    
        if (!cart) return res.json({ success: false, error: "Cart not found." });
    
        // ✅ Recalculate offers and totals
        const activeOffers = await Offer.find({
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          isActive: true,
        });
    
        let subtotal = 0;
        let offerDiscount = 0;
    
        for (const item of cart.items) {
          const product = item.product;
    
          // Apply offers
          const offers = activeOffers.filter(o => {
            if (o.applicableTo === "product" && o.products.some(p => p.toString() === product._id.toString())) return true;
            if (o.applicableTo === "category" && o.category?.toString() === product.category?._id?.toString()) return true;
            if (o.applicableTo === "all") return true;
            return false;
          });
    
          // Choose best offer
          let bestDiscount = 0;
          for (const offer of offers) {
            const discount = offer.discountType === "percentage"
              ? Math.round((product.item_price * offer.discountValue) / 100)
              : offer.discountValue;
            if (discount > bestDiscount) bestDiscount = discount;
          }
    
          const discountedPrice = Math.max(product.item_price - bestDiscount, 0);
          subtotal += discountedPrice * item.quantity;
          offerDiscount += bestDiscount * item.quantity;
        }
    
        await cart.save();
    
        return res.json({
          success: true,
          message: "Cart updated successfully.",
          subtotal,
          offerDiscount,
        });
    
      } catch (err) {
        console.error("Error updating cart:", err);
        res.json({ success: false, error: "Server error." });
      }       
    };
    
    

module.exports = {
    loadCart,
    addtoCart,
    removeCart,
    updateCart

}