const Cart  = require('../models/cartModel');
const User = require('../models/userSchema');
const Product = require('../models/itemModel');
const Booking = require('../models/bookingModel')
const Offer = require('../models/offerModel')

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

    // Get most recent booking for qty
    const booking = await Booking.findOne({ user: user })
      .sort({ createdAt: -1 })
      .select("guestCount");

    if (!booking) return res.redirect('/eventDetails');
    const qty = booking.guestCount;

    // Offer fetching
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
      console.log('The testing for the product is :',product)
      const quantity = item.quantity;

       const productOffer = activeOffers.find(o =>
        o.applicableTo === 'product' &&
        Array.isArray(o.products) &&
        o.products.some(pid => pid.toString() === product._id.toString())
      );
    
      console.log('the sample for product offer is :',productOffer)
      
      let categoryOffer = activeOffers.find(
        o => o.applicableTo === 'category' && o.category?.toString() === product.category._id.toString()
      );

      let discountPerItem = 0;

      if (productOffer) {
        discountPerItem = calculateOffer(productOffer, product.item_price);
      } else if (categoryOffer) {
        discountPerItem = calculateOffer(categoryOffer, product.item_price);
      }

      const discountedPrice = product.item_price - discountPerItem;
      const totalForItem = discountedPrice * quantity;
      console.log('the totalforitem is for example:',totalForItem)

      subtotal += totalForItem;
      offerDiscount += discountPerItem * quantity;
      productTotal.push(totalForItem);
     

      return {
        ...item._doc,
        discountedPrice,
        offerApplied: discountPerItem,
      };
    });
    

  

    const shipping = 0; // add shipping logic if needed
    const subtotalWithShipping = subtotal + shipping;

    // Validate against guest count
    for (let item of cart) {
      if (item.quantity > qty) {
        return res.render('user/product/cart', {
          user,
          cart: cartItemsWithDiscount,
          productTotal,
          subtotalWithShipping: 0,
          qty,
          offerDiscount,
          totalAfterOffer: 0,
          error: `The quantity for ${item.product.name} exceeds available Guest Count (${qty})!`,
        });
      }
    }

    res.render("user/product/cart", {
      user,
      cart: cartItemsWithDiscount,
      productTotal,
      subtotalWithShipping,
      qty,
      offerDiscount,
      totalAfterOffer: subtotalWithShipping
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Utility Function
function calculateOffer(offer, price) {
  if (offer.discountType === "percentage") {
    return Math.round((price * offer.discountValue) / 100);
  } else {
    return offer.discountValue;
  }
}



const addtoCart = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const { productId, qty } = req.body;
  
      // Validate input
      if (!productId || !qty || isNaN(qty)) {
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
        const { productId, quantity } = req.query;
        const newQuantity = parseInt(quantity);
    
        if (!userId || !productId || isNaN(newQuantity)) {
          return res.status(400).json({ success: false, error: "Invalid input." });
        }
    
        // Update cart item quantity
        const cartItem = await Cart.findOneAndUpdate(
          { user: userId, "items.product": productId },
          {
            $set: {
              "items.$.quantity": newQuantity,
            },
          }
        );
        console.log('The  cart item for checking is :',cartItem)
    
        if (!cartItem) {
          return res.status(404).json({ success: false, error: "Cart item not found." });
        }
    
        res.json({ success: true, message: "Cart updated successfully." });
    
      } catch (err) {
        console.error("Error updating cart quantity:", err);
        res.status(500).json({ success: false, error: "Server error." });
      }
    };
    


module.exports = {
    loadCart,
    addtoCart,
    removeCart,
    updateCart

}