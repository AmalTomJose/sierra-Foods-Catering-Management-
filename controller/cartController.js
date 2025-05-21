const Cart  = require('../models/cartModel');
const User = require('../models/userSchema');
const Product = require('../models/itemModel');
const Booking = require('../models/bookingModel')



const loadCart = async (req, res) => {
    try {
        const user = req.session.user_id;


        const userCart = await Cart.findOne({user }).populate("items.product");
        
        if (!userCart || userCart.items.length === 0) {
            return res.render("user/product/cart", {
                user,
                cart: [],
                productTotal: [],
                subtotalWithShipping: 0
            });
        }

        const cart = userCart.items;
        const productTotal = cart.map(item => {
            const price = item.product.discount_price;
            return price * item.quantity;
        });

        //calculating qty using the guest Count
        const booking= await Booking.findOne({ user: user })
        .sort({ createdAt: -1 }) // Sort by most recent
        .select("guestCount"); 
        const qty = booking.guestCount 
        
        // Calculate subtotal
        const subtotal = productTotal.reduce((acc, val) => acc + val, 0);
        
        const shipping = 0; // Or any logic you want
        const subtotalWithShipping = subtotal + shipping;
        
        res.render("user/product/cart", { user, cart, productTotal, subtotalWithShipping,qty });
        

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


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