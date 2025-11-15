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
const Notification = require('../models/notificationModel')
const Offer = require('../models/offerModel')
const Coupon = require('../models/coupenModel')
const {debitFromWallet} = require('./walletController');



const failurePage = async (req, res) => {
  const userId = req.session.user_id;
  const orderId = req.params.id;
  res.render('user/order/orderFailure', { orderId,user:userId });
};


// Utility function outside controller
function calculateOffer(offer, price) {
  if (offer.discountType === "percentage") {
    return Math.round((price * offer.discountValue) / 100);
  } else {
    return offer.discountValue;
  }
}
const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      model: "Item",            
      populate: {
        path: "category",
        model: "Category",
      },
    });

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    const cartItems = cart.items || [];

    // Fetch active offers
    const activeOffers = await Offer.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      isActive: true,
    });

    let subtotal = 0;
    let offerDiscount = 0;
    const productTotal = [];

    for (let item of cartItems) {
      const product = item.product;
      const quantity = item.quantity;

      // 🔹 Find product-specific offer
      const productOffer = activeOffers.find(
        (o) =>
          o.applicableTo === "product" &&
          Array.isArray(o.products) &&
          o.products.some((pid) => pid.toString() === product._id.toString())
      );

      // 🔹 Find category-specific offer
      const categoryOffer = activeOffers.find(
        (o) =>
          o.applicableTo === "category" &&
          o.category?.toString() === product.category._id.toString()
      );

      // 🔹 Find universal offer (applicable to all products)
      const universalOffer = activeOffers.find((o) => o.applicableTo === "all");

      let discountPerItem = 0;

      if (productOffer) {
        discountPerItem = calculateOffer(productOffer, product.item_price);
      } else if (categoryOffer) {
        discountPerItem = calculateOffer(categoryOffer, product.item_price);
      } else if (universalOffer) {
        discountPerItem = calculateOffer(universalOffer, product.item_price);
      }

      const discountedPrice = product.item_price - discountPerItem;
      const totalForItem = discountedPrice * quantity;

      subtotal += totalForItem;
      offerDiscount += discountPerItem * quantity;
      productTotal.push(totalForItem);
    }

    const subtotalWithShipping = subtotal; // free shipping
    req.session.subtotalwithshipping =
      subtotalWithShipping > 50000 ? 50000 : subtotalWithShipping;

    // Get user's active address
    const addressData = await Booking.findOne({ user: userId, status: "active" });
    if (!addressData) {
      return res.redirect("/eventDetails");
    }

    // Validate quantities vs guest count
    for (let item of cartItems) {
      if (item.quantity > addressData.guestCount) {
        return res.redirect("/cart");
      }
    }

    return res.render("user/order/checkout", {
      user: userId,
      userData,
      addressData,
      cart: cartItems,
      productTotal,
      subtotalWithShipping,
      offerDiscount,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log("Checkout Load Error:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

const checkOutPost = async (req, res) => {
  try {
    const { address, paymentMethod, coupon, couponDiscount, finalAmount } = req.body;
    const userId = req.session.user_id;

    // 🛒 Step 1: Fetch cart and booking
    const userCart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    const booking = await Booking.findOne({ user: userId, status: "active" });
    if (!booking) {
      return res.status(400).json({ success: false, error: "Booking not found" });
    }

    if (paymentMethod === "wallet") {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet)
        return res.status(400).json({ error: "Wallet not found" });
    
      if (wallet.balance < finalAmount)
        return res.status(400).json({ error: "Insufficient wallet balance" });
    }
    
    // 🎁 Step 3: Fetch active offers
    const activeOffers = await Offer.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      isActive: true,
    });

    let subtotal = 0;
    const orderItems = [];

    // 🧾 Step 4: Apply offer logic
    for (const item of userCart.items) {
      const product = item.product;
      const quantity = item.quantity;
      let discountPerItem = 0;

      // 🔹 Product-specific offer
      const productOffer = activeOffers.find(
        (o) =>
          o.applicableTo === "product" &&
          Array.isArray(o.products) &&
          o.products.some((pid) => pid.toString() === product._id.toString())
      );

      // 🔹 Category-specific offer
      const categoryOffer = activeOffers.find(
        (o) =>
          o.applicableTo === "category" &&
          o.category?.toString() === product.category?._id.toString()
      );

      // 🔹 Universal (ALL) offer
      const universalOffer = activeOffers.find((o) => o.applicableTo === "all");

      // ✅ Apply in order of priority: product → category → all
      if (productOffer) {
        discountPerItem = calculateOffer(productOffer, product.item_price);
      } else if (categoryOffer) {
        discountPerItem = calculateOffer(categoryOffer, product.item_price);
      } else if (universalOffer) {
        discountPerItem = calculateOffer(universalOffer, product.item_price);
      }

      const discountedPrice = product.item_price - discountPerItem;
      const itemTotal = discountedPrice * quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity,
        price: discountedPrice,
        offerDiscount: discountPerItem,
        status: "ordered",
        couponDiscount: 0, // to be distributed later
      });
    }

    // 🎟️ Step 5: Distribute coupon discount proportionally
    let distributed = 0;
    for (let i = 0; i < orderItems.length; i++) {
      const itemTotal = orderItems[i].price * orderItems[i].quantity;
      let share = Math.floor((itemTotal / subtotal) * couponDiscount);

      // Ensure the last item gets remaining discount
      if (i === orderItems.length - 1) {
        share = couponDiscount - distributed;
      }

      distributed += share;
      orderItems[i].couponDiscount = share;
    }

    // 🧾 Step 6: Save new order
    const newOrder = new Order({
      user: userId,
      booking: booking._id,
      deliveryDate: booking.eventDate,
      paymentMethod,
      paymentStatus: "paid",
      totalAmount: subtotal,
      finalAmount,
      couponUsed: coupon || null,
      couponDiscount: couponDiscount || 0,
      status: "confirmed",
      items: orderItems,
    });

    await newOrder.save();

    if (paymentMethod === "wallet") {
      await debitFromWallet(userId, finalAmount, newOrder._id, 'Order payment via wallet');
    }
    // 🧾 Step 7.1: Mark coupon as used (if applicable)
if (coupon) {
  await Coupon.findOneAndUpdate(
    { code: coupon },
    { $addToSet: { usedBy: userId } } // prevents duplicates
  );
}


    // 🧹 Step 7: Cleanup after order
    booking.status = "completed";
    await booking.save();

    const eventDate = new Date(booking.eventDate).toISOString().split("T")[0];
    await DailyCount.findOneAndUpdate(
      { date: new Date(eventDate) },
      {
        $inc: {
          totalBookings: 1,
          totalGuests: parseInt(booking.guestCount),
        },
      },
      { upsert: true, new: true }
    );

    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], total: 0 } });

    return res.status(200).json({ success: true, message: "Order placed successfully" });
  } catch (err) {
    console.error("Checkout Error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Utility: Offer Calculation
function calculateOffer(offer, price) {
  if (offer.discountType === "percentage") {
    return Math.round((price * offer.discountValue) / 100);
  } else {
    return offer.discountValue;
  }
}


const codWalletPayment = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const {
      address,
      paymentMethod,
      coupon,
      couponDiscount,
      finalAmount,
    } = req.body;

    console.log("COD WALLET REQUEST BODY:", req.body);

    // 1️⃣ Fetch Cart
    const userCart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // 2️⃣ Fetch Booking
    const booking = await Booking.findOne({ user: userId, status: "active" });
    if (!booking) {
      return res.status(400).json({ success: false, error: "No active booking found" });
    }

    // 3️⃣ Fetch Active Offers
    const activeOffers = await Offer.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      isActive: true,
    });

    let subtotal = 0;
    const orderItems = [];

    // 4️⃣ Apply Offer Logic
    for (const item of userCart.items) {
      const product = item.product;
      const quantity = item.quantity;

      let discountPerItem = 0;

      const productOffer = activeOffers.find(
        o => o.applicableTo === "product" && o.products?.includes(product._id)
      );

      const categoryOffer = activeOffers.find(
        o => o.applicableTo === "category" && o.category?.toString() === product.category?._id.toString()
      );

      const universalOffer = activeOffers.find(o => o.applicableTo === "all");

      if (productOffer) discountPerItem = calculateOffer(productOffer, product.item_price);
      else if (categoryOffer) discountPerItem = calculateOffer(categoryOffer, product.item_price);
      else if (universalOffer) discountPerItem = calculateOffer(universalOffer, product.item_price);

      const discountedPrice = product.item_price - discountPerItem;

      subtotal += discountedPrice * quantity;

      orderItems.push({
        product: product._id,
        quantity,
        price: discountedPrice,
        offerDiscount: discountPerItem,
        couponDiscount: 0,
        status: "ordered",
      });
    }

    // 5️⃣ Distribute Coupon
    let distributed = 0;
    for (let i = 0; i < orderItems.length; i++) {
      let itemTotal = orderItems[i].price * orderItems[i].quantity;
      let share = Math.floor((itemTotal / subtotal) * couponDiscount);

      if (i === orderItems.length - 1) {
        share = couponDiscount - distributed;
      }

      distributed += share;
      orderItems[i].couponDiscount = share;
    }

    // 6️⃣ COD Wallet Advance (25%)
    const advanceAmount = Math.round(finalAmount * 0.25);

    const wallet = await Wallet.findOne({ user:userId });
    if (!wallet || wallet.balance < advanceAmount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient Wallet Balance",
      });
    }


    // 7️⃣ Save Order
    const newOrder = new Order({
      user: userId,
      booking: booking._id,
      deliveryDate: booking.eventDate,
      address,
      items: orderItems,
      paymentMethod: "cashondelivery",
      paymentStatus: "partial",
      totalAmount: subtotal,
      finalAmount,
      couponUsed: coupon || null,
      couponDiscount,
      advanceAmount,
      status: "confirmed",
    });

    await newOrder.save();
    // Deduct from wallet
    await debitFromWallet(userId, advanceAmount,newOrder._id, "COD 25% Advance Payment");

    // 8️⃣ Mark Coupon Used
    if (coupon) {
      await Coupon.findOneAndUpdate(
        { code: coupon },
        { $addToSet: { usedBy: userId } }
      );
    }

    // 9️⃣ Booking Completed
    booking.status = "completed";
    await booking.save();

    // 🔟 Update DailyCount
    const eventDate = new Date(booking.eventDate).toISOString().split("T")[0];
    await DailyCount.findOneAndUpdate(
      { date: new Date(eventDate) },
      {
        $inc: {
          totalBookings: 1,
          totalGuests: parseInt(booking.guestCount),
        },
      },
      { upsert: true }
    );

    // 1️⃣1️⃣ Clear Cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], total: 0 } }
    );

    return res.status(200).json({
      success: true,
      message: "Order placed successfully using Wallet + COD",
      orderId: newOrder._id,
    });

  } catch (error) {
    console.log("COD WALLET ERROR:", error);
    return res.status(500).json({ success: false, error: "Something went wrong!" });
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
  
      // Find order that belongs to the logged-in user only
      const order = await Order.findOne({ _id: orderId, user: userId })
        .populate("user")
        .populate({
          path: "booking",
          model: "Booking",
        })
        .populate({
          path: "items.product",
          model: "Item",
        });
  
      // If order not found or not owned by user
      if (!order) {
        return res.status(403).render("user/general/pagenotfound", {
          message: "Access Denied: You are not authorized to view this order.",
          user: userData,
        });
      }
  

      const extractedOrderId = order.orderId;
  
      res.render("user/order/orderDetails", {
        user: userId,
        userData,
        order,
        orderId: extractedOrderId,
      });
    } catch (error) {
      console.error("Error loading order details:", error);
      res.status(500).render("user/error", { message: "Internal Server Error" });
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
    const { paymentMethod, finalAmount } = req.body;

    if (!paymentMethod || !finalAmount) {
      return res.status(400).json({ success: false, error: 'Invalid payment request.' });
    }

    // Amount calculation (in paisa)
    let amountInPaise = 0;

    if (paymentMethod === 'cashondelivery') {
      amountInPaise = Math.round(finalAmount * 100);  // ✅ Already 25%
    } else {
      amountInPaise = Math.round(finalAmount * 100);
    }
    
    if (amountInPaise > 5000000) {
      console.warn('Capping Razorpay test amount to ₹50,000');
      amountInPaise = 5000000;
    }


    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
    });

    return res.status(200).json(order);
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
};







// Utility to calculate offer value
function calculateOffer(offer, price) {
  return offer.discountType === "percentage"
    ? Math.round((price * offer.discountValue) / 100)
    : offer.discountValue;
}

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentMethod,
      coupon,
      couponDiscount,
      finalAmount,
    } = req.body;

    const userId = req.session.user_id;

    // 🔐 Step 1: Verify Razorpay Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("❌ Razorpay Signature Mismatch");
      return res.status(200).json({
        success: false,
        error: "Payment verification failed",
        orderId: null,
      });
    }

    // 🛒 Step 2: Fetch cart and booking
    const userCart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    const booking = await Booking.findOne({ user: userId, status: "active" });
    if (!booking) {
      return res.status(400).json({ success: false, error: "Booking not found" });
    }

    // 🎁 Step 3: Fetch active offers
    const activeOffers = await Offer.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      isActive: true,
    });

    let subtotal = 0;
    const orderItems = [];

    // 🧾 Step 4: Process cart items with offer discount
    for (const item of userCart.items) {
      const product = item.product;
      const quantity = item.quantity;

      let discountPerItem = 0;

      // 🔹 Product-level offer
      const productOffer = activeOffers.find(
        (o) =>
          o.applicableTo === "product" &&
          Array.isArray(o.products) &&
          o.products.some((pid) => pid.toString() === product._id.toString())
      );

      // 🔹 Category-level offer
      const categoryOffer = activeOffers.find(
        (o) =>
          o.applicableTo === "category" &&
          o.category?.toString() === product.category?._id.toString()
      );

      // 🔹 Universal offer (applies to all)
      const universalOffer = activeOffers.find((o) => o.applicableTo === "all");

      // 🧮 Apply highest priority: product → category → all
      if (productOffer) {
        discountPerItem = calculateOffer(productOffer, product.item_price);
      } else if (categoryOffer) {
        discountPerItem = calculateOffer(categoryOffer, product.item_price);
      } else if (universalOffer) {
        discountPerItem = calculateOffer(universalOffer, product.item_price);
      }

      const discountedPrice = product.item_price - discountPerItem;
      const itemTotal = discountedPrice * quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity,
        price: discountedPrice,
        offerDiscount: discountPerItem,
        status: "ordered",
        couponDiscount: 0, // will be distributed later
      });
    }

    // 🎟️ Step 5: Distribute coupon discount proportionally
    let distributed = 0;
    for (let i = 0; i < orderItems.length; i++) {
      const itemTotal = orderItems[i].price * orderItems[i].quantity;
      let share = Math.floor((itemTotal / subtotal) * couponDiscount);

      // Make sure last item gets remaining discount
      if (i === orderItems.length - 1) {
        share = couponDiscount - distributed;
      }

      distributed += share;
      orderItems[i].couponDiscount = share;
    }

    // 💳 Step 6: Payment logic
    let paymentStatus = "paid";
    let advanceAmount = finalAmount;

    if (paymentMethod === "cashondelivery") {
      paymentStatus = "partial";
      advanceAmount = Math.round(finalAmount * 0.25);
    }

    // 📝 Step 7: Save order
    const newOrder = new Order({
      user: userId,
      booking: booking._id,
      deliveryDate: booking.eventDate,
      paymentMethod,
      paymentStatus,
      totalAmount: subtotal,
      finalAmount,
      couponUsed: coupon || null,
      couponDiscount: couponDiscount || 0,
      advanceAmount,
      status: "confirmed",
      items: orderItems,
    });

    await newOrder.save();
    // 🧾 Step 7.1: Mark coupon as used (if applicable)
if (coupon) {
  await Coupon.findOneAndUpdate(
    { code: coupon },
    { $addToSet: { usedBy: userId } } // prevents duplicates
  );
}


    // 🧹 Step 8: Cleanup
    booking.status = "completed";
    await booking.save();

    const eventDate = new Date(booking.eventDate).toISOString().split("T")[0];
    await DailyCount.findOneAndUpdate(
      { date: new Date(eventDate) },
      {
        $inc: {
          totalBookings: 1,
          totalGuests: parseInt(booking.guestCount),
        },
      },
      { upsert: true, new: true }
    );

    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], total: 0 } });

    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("Razorpay Verify Error:", err);
    return res.status(500).json({ success: false, error: "Payment verification failed" });
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


        const message = `Cancel Request for item ${item.product.item_name}`
        await Notification.create({
          type:'cancelRequest',
          orderId:orderId,
          message,
        })

        //logic getting admin socket.io if a user request refund

        const io = req.app.get('io');
        io.to('adminRoom').emit('cancelRequest',{
          orderId,
          itemId,
          message:` cancel request received for  item ${item.product.item_name}`
        })

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
      const order = await Order.findById(orderId).populate('items.product');
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  
      const today = new Date();
      const deliveryDate = new Date(order.deliveryDate);
      const diffInDays = (deliveryDate - today) / (1000 * 60 * 60 * 24);
  
      if (diffInDays < 2) {
        return res.status(400).json({ success: false, message: 'Cannot cancel within 2 days of delivery' });
      }
  
      // Cancel each item
      order.items.forEach(item => {
        item.status = 'cancelled';
        item.refundStatus = (order.paymentMethod === 'cashondelivery') ? 'none' : 'requested';
      });
  
      order.status = 'cancelled';
      order.refundStatus = (order.paymentMethod === 'online' || order.paymentMethod === 'wallet') 
        ? 'requested' 
        : 'none';
  
      await order.save();
  
      // Notify admin only if refund is requested
      if (order.refundStatus === 'requested') {
        const io = req.app.get('io');
  
        // Create a single admin notification
        await Notification.create({
          type: 'cancelRequest',
          orderId: order._id,
          message: `User requested cancellation and refund for Order #${order._id}`
        });
  
        // Emit socket event
        io.to('adminRoom').emit('cancelRequest', {
          orderId: order._id,
          message: `Cancel request received for Order #${order._id}`
        });
  
        return res.json({ success: true, message: 'Cancellation submitted for admin approval.' });
      }
  
      // If payment method is COD and no refund needed
      return res.json({ success: true, message: 'Order cancelled successfully (no refund needed).' });
  
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
    verifyPayment,
    failurePage,
    codWalletPayment
}