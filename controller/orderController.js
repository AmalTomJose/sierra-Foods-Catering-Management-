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
const Wallet = require('../models/walletModel')







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
        status: 'confirmed',
        paymentStatus: paymentMethod === 'Wallet' ? 'paid' : 'pending',
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // Wallet check
    if (paymentMethod === 'Wallet') {
      const walletBalance = await Wallet.findById(userId);
      if (walletBalance.balance < totalAmount) {
        return res.status(400).json({ success: false, error: 'Insufficient wallet balance.' });
      }
      walletBalance.balance -= totalAmount;
      await walletBalance.save();
    }

    const booking = await Booking.findOne({ user: userId, status: 'active' });
    if (!booking) return res.status(400).json({ success: false, error: 'Booking not found.' });

    const newOrder = new Order({
      user: userId,
      booking: booking._id,
      deliveryDate:booking.eventDate,
      paymentMethod,
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
        const ordering = await Order.findById(orderId);
        console.log('Fuckeeeeeerrrrr::',ordering)
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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, address } = req.body;
    console.log(address)
  
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
  
    if (generatedSignature === razorpay_signature) {
      // Create and save order
      const order = new Order({
        user: req.session.user_id,
        booking: address,
        totalAmount: req.session.subtotalWithShipping,
        paymentMethod: "Online",
        paymentStatus: "paid",
        status: "confirmed",
      });
  
      await order.save();
  
      // Optionally clear cart
      await Cart.deleteOne({ user: req.session.user_id });
  
      res.json({ success: true, message: "Order placed successfully!" });
    } else {
      res.status(400).json({ success: false, error: "Invalid payment signature" });
    }
  };
  






module.exports = {
    loadCheckout,
    checkOutPost,
    loadOrderDetails,
    loadOrderHistory,
    loadUpdateBooking,
    updateBooking,
    loadOrderSuccess,
    createRazorpayOrder,
    verifyPayment
}