const User = require('../models/userSchema');
const Booking  = require('../models/bookingModel');
const Address = require('../models/addressModel');
const  Cart = require('../models/cartModel');
const Product = require('../models/cartModel');
const Order = require('../models/orderModel')
const  mongoose = require('mongoose')
const DailyCount = require('../models/dailybookingCount')
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require('../models/walletModel');
const { changePasswordFromProfile } = require('./addressController');







const loadCheckout = async(req,res)=>{
    try{
       
             const userId = req.session.user_id;
             const userData = await User.findById(userId);



             let cart = await Cart.findOne({user:userId})
          
             .populate({
                path:'items.product',
                model:'Item',
             })
             .exec();
             if(!cart){
                console.log('Cart not found');
                return res.status(404).send('cart not found')
             }

             const cartItems = cart.items || [];
              console.log('THe cart items are::;',cartItems)
            

             

             const productTotal = cartItems.map(item => {
                const price = item.product.discount_price;
                return price * item.quantity;
            });
            
            // Calculate subtotal
            const subtotal = productTotal.reduce((acc, val) => acc + val, 0);
            
            const shipping = 0; // Or any logic you want
            const subtotalWithShipping = subtotal + shipping;
            if(subtotalWithShipping >100000){
              req.session.subtotalwithshipping=50000
            }
            else{
              req.session.subtotalwithshipping = subtotalWithShipping


            }

            const addressData = await Booking.findOne({user:userId,status:'active'})
            if(!addressData){
              return res.redirect('/eventDetails')
            }
            // Validate each item in cart
            for (let item of cartItems) {
              if (item.quantity > addressData.guestCount) {
                return res.redirect('/cart')
              }
            }

            console.log(addressData)
            res.render('user/order/checkout',{user:userId,userData,addressData,cart:cartItems,productTotal,subtotalWithShipping,razorpayKey: process.env.RAZORPAY_KEY_ID,})
        }
    catch(error)
    {
        console.log(error.message)
    }
}


const checkOutPost = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { address, paymentMethod } = req.body;

    if (!address || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'Address and payment method are required.' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty.' });
    }

    const orderItems = cart.items.map((item) => {
      const product = item.product;
      const price = product.discout_status ? product.item_price : product.discount_price;
      return {
        product: product._id,
        quantity: item.quantity,
        price,
        status: 'ordered',
        // paymentStatus: paymentMethod === 'Wallet' ? 'paid' : 'pending',
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // Wallet check
    let paymentStatus = 'pending';

    if (paymentMethod === 'Wallet') {
      const walletBalance = await Wallet.findById(userId);

      if(!walletBalance){
        return res.status(400).json({ success: false, error: 'Wallet not found ! ' });

      }
      if (walletBalance.balance < totalAmount) {
        return res.status(400).json({ success: false, error: 'Insufficient wallet balance.' });
      }
      walletBalance.balance -= totalAmount;
      paymentStatus = 'paid';
  
      await walletBalance.save();

    }

    const booking = await Booking.findOne({ user: userId, status: 'active' });
    if (!booking) return res.status(400).json({ success: false, error: 'Booking not found.' });

    const newOrder = new Order({
      user: userId,
      booking: booking._id,
      deliveryDate:booking.eventDate,
      paymentMethod,
      status:'confirmed',
      paymentStatus:paymentStatus || 'pending',
      totalAmount,
      items: orderItems,
    });

    await newOrder.save();

    booking.status = 'completed';
    await booking.save();

    const eventDay = new Date(booking.eventDate).toISOString().split('T')[0];
    await DailyCount.findOneAndUpdate(
      { date: new Date(eventDay) },
      {
        $inc: {
          totalBookings: 1,
          totalGuests: parseInt(booking.guestCount),
        },
      },
      { upsert: true, new: true }
    );

    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], total: 0 } });

    return res.status(200).json({ success: true, message: 'Order placed successfully' });
  } catch (err) {
    console.error('Checkout Error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};



const loadOrderDetails = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const userData = await User.findById(userId);
  
      const page = parseInt(req.query.page) || 1;
      const pageSize = 7;
  
      const totalCount = await Order.countDocuments({
        user: new mongoose.Types.ObjectId(userId),
      });
  
      const orders = await Order.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $sort: { _id: -1 }, // Sort by order creation
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        {
          $addFields: {
            items: {
              $map: {
                input: '$items',
                as: 'item',
                in: {
                  $mergeObjects: [
                    '$$item',
                    {
                      productDetail: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$productDetails',
                              as: 'pd',
                              cond: {
                                $eq: ['$$pd._id', '$$item.product'],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            productDetails: 0, // Remove temporary field
          },
        },
      ]);
  
      res.render("user/order/order", {
        user: userId,
        userData,
        orders,
        page,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } catch (error) {
      console.log("Error in loadOrderDetails:", error.message);
      res.redirect("/500");
    }
  };


const loadOrderHistory = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const orderId = req.params.id;
        const userData = await User.findById(userId);
        // const ordering = await Order.findById(orderId);
        // console.log('Fuckeeeeeerrrrr::',ordering)
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({
                path: "booking",
                model: "Booking",
            })
            .populate({
                path: "items.product",
                model: "Item",
            });

        console.log('To view order details::',order); // Log the order object to check the coupon information


        // Extract order ID from the order object without re-declaring the variable
        const extractedOrderId = order.orderId;

        res.render("user/order/orderDetails", {user:userId, userData, order, orderId: extractedOrderId }); // Pass coupon information to the template
    } catch (error) {
        console.log(error.message);
    }
};

const loadUpdateBooking= async (req, res) => {
  try {
    const user = req.session.user_id;
    const bookingId = req.query.id;

    const booking = await Booking.findById(bookingId); 
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/');
    }
    if(booking.status != 'active'){
      return res.redirect('/eventDetails')
    }

    res.render('user/booking/updateEventDetails', {user, booking });
  } catch (err) {
    console.error('Error loading update page:', err);
    res.status(500).send('Internal Server Error');
  }
};



const updateBooking = async (req, res) => {
  try {
    const bookingId = req.query.id;

    const {
      date,
      eventType,
      guest,
      place,
      time,
      district,
      pincode
    } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    // Update booking details
    booking.eventDate = date;
    booking.eventType = eventType;
    booking.guestCount = guest;
    booking.eventPlace = place;
    booking.eventTime = time;
    booking.eventDistrict = district;
    booking.pincode = pincode;

    await booking.save();

    req.flash('success', 'Booking updated successfully!');
    return res.redirect('/cart');

  } catch (error) {
    console.error('Error updating booking:', error.message);
    return res.status(500).send('Server error');
  }
};

  
  const loadOrderSuccess = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const order = await Order.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate('booking')
      .lean();
    
    if (!order || !order.booking) {
      return res.redirect('/');
    }
    
    res.render('user/order/orderSuccess', {
      user: userId,
      order
    });
    
    } catch (err) {
      console.error('Error loading order success:', err);
      res.redirect('/');
    }
  };
  


  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  
  const createRazorpayOrder = async (req, res) => {
    try {
      const amount = req.session.subtotalwithshipping * 100;
  
      const options = {
        amount: amount,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
      };
  
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create Razorpay order" });
    }
  };

  const verifyPayment = async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, address ,paymentMethod} = req.body;
    console.log(address)
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty.' });
    }

    const orderItems = cart.items.map((item) => {
      const product = item.product;
      const price = product.discout_status ? product.item_price : product.discount_price;
      return {
        product: product._id,
        quantity: item.quantity,
        price,
        status: 'ordered',
        
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  
    const booking = await Booking.findById({ _id:address});
    if (!booking) return res.status(400).json({ success: false, error: 'Booking not found.' });
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
  
    if (generatedSignature === razorpay_signature) {
      // Create and save order
      const order = new Order({
        user: userId,
        booking: booking._id,
        deleveryDate:booking.eventDate,
       status:'confirmed',
        totalAmount,
        paymentMethod,
        paymentStatus:'paid',
        items:orderItems
      });

      await order.save();

    booking.status = 'completed';
    await booking.save();

    const eventDay = new Date(booking.eventDate).toISOString().split('T')[0];
    await DailyCount.findOneAndUpdate(
      { date: new Date(eventDay) },
      {
        $inc: {
          totalBookings: 1,
          totalGuests: parseInt(booking.guestCount),
        },
      },
      { upsert: true, new: true }
    );

    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], total: 0 } });

    return res.status(200).json({ success: true, message: 'Order placed successfully' });
  
     
    } else {
      res.status(400).json({ success: false, error: "Invalid payment signature" });
    }
  };

  
  const cancelItem = async (req, res) => {
    const { orderId, itemId } = req.params;
  
    try {
      const order = await Order.findById(orderId).populate('items.product').populate('user');
  
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      // Check if cancellation is before 2 full days of delivery
      const today = new Date();
      const deliveryDate = new Date(order.deliveryDate);
      today.setHours(0, 0, 0, 0);
      deliveryDate.setHours(0, 0, 0, 0);
      const diffDays = (deliveryDate - today) / (1000 * 60 * 60 * 24);
  
      if (diffDays < 2) {
        return res.json({
          success: false,
          message: 'Item can only be cancelled at least 2 days before delivery.'
        });
      }
  
      // Find item and check if it's already cancelled
      const item = order.items.find(i => i._id.toString() === itemId);
      if (!item || item.status === 'Cancelled') {
        return res.json({ success: false, message: 'Item not found or already cancelled' });
      }
  
      if (order.paymentMethod === 'cashondelivery') {
        // Auto-cancel for COD
        item.status = 'cancelled';
        item.refundStatus = 'none';
        await order.save();
        return res.json({ success: true, message: 'Item cancelled successfully (COD).' });
  
      } else if (order.paymentMethod === 'wallet' || order.paymentMethod === 'online') {
        // Requires admin approval
        item.status = 'cancelled';
        item.refundStatus = 'requested';
        await order.save();
        return res.json({ success: true, message: 'Cancellation submitted for admin approval.' });
      }
  
      res.json({ success: false, message: 'Invalid payment method.' });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  const cancelOrder = async (req, res) => {
    const { orderId } = req.params;
  
    try {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  
      const today = new Date();
      const deliveryDate = new Date(order.deliveryDate);
      const diffInDays = (deliveryDate - today) / (1000 * 60 * 60 * 24);
  
      if (diffInDays < 2) {
        return res.status(400).json({ success: false, message: 'Cannot cancel within 2 days of delivery' });
      }
  
      // Cancel all items
      order.items.forEach(item => {
        item.status = 'cancelled';
        item.refundStatus = (order.paymentMethod === 'cashondelivery') ? 'none' : 'requested';
      });
  
     order.status='cancelled'
  
      // Set refund request for online or wallet payments 
      if (order.paymentMethod === 'online' || order.paymentMethod === 'wallet') {
        order.refundStatus = 'requested';
     
      } else {
        order.refundStatus = 'none';
        
      }
  
      await order.save();
      res.json({ success: true, message: 'Order cancelled successfully.' });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

module.exports = {
    loadCheckout,
    checkOutPost,
    loadOrderDetails,
    loadOrderHistory,
    cancelItem,
    cancelOrder,
    loadUpdateBooking,
    updateBooking,
    loadOrderSuccess,
    createRazorpayOrder,
    verifyPayment
}