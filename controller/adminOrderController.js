  const User  = require('../models/userSchema');
  const Booking = require('../models/bookingModel');
  const Order = require('../models/orderModel');
  const Cart = require('../models/cartModel');
  const Product = require('../models/itemModel');
  const dateFun = require('../config/dateData');
  const Wallet = require('../models/walletModel');
  const DailyCount = require('../models/dailybookingCount')
  
  
  const listUserOrders = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = 8;
      const skip = (page - 1) * pageSize;
      const statusFilter = req.query.status;
  
      let query = {};
      if (statusFilter) {
        query.status = statusFilter;
      }
  
      const totalCount = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalCount / pageSize);
  
      const orders = await Order.find(query)
        .populate("user")
        .skip(skip)
        .limit(pageSize)
        .sort({ orderDate: -1 });
  
      // AJAX request: send JSON
      if (req.xhr) {
        return res.json({ orders, currentPage: page, totalPages });
      }
  
      // Normal request: render full EJS
      res.render("admin/order/allOrder", {
        order: orders,
        currentPage: page,
        totalPages,
        selectedStatus: statusFilter,
      });
    } catch (error) {
      console.log("Error listing user orders:", error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const listOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        if (!orderId) {
            // Handle the case where orderId is not provided in the query parameters.
            return res.status(400).send('Order ID is missing.');
        }
  
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
  
        if (!order) {
            // Handle the case where the order with the given ID is not found.
            return res.status(404).send('Order not found.');
        }
        console.log('The testing is :',order)
        // Render the template with async: true option
        res.render("admin/order/orderDetails", { order });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
  };
  

  const orderStatus = async (req, res) => {
    try {
      const { orderId, status } = req.body;
      console.log('Hi the value for the status is:',status)
      const userId = req.session.user_id;
  
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'requested', 'approved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

  
      // Fetch order and update item statuses
      const order = await Order.findById(orderId).populate('booking');
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

  
      // Update order status
      order.refundStatus = status;
  
      // Update status of each item
      order.items.forEach(item => {
        item.status = 'cancelled'
        item.refundStatus = status;
      });
  
      await order.save();

      if (status === 'approved') {
        const userId = order.user;
        const totalRefund = order.finalAmount;
      
        if (totalRefund > 0) {
          let wallet = await Wallet.findOne({ user: userId });
      
          // Create wallet if it doesn't exist
          if (!wallet) {
            wallet = new Wallet({ user: userId, balance: 0 });
          }
      
          wallet.balance += totalRefund;
          await wallet.save();
        }
      }
      if(order.refundStatus=='approved' && order.status=='cancelled'){

    const eventDate = new Date(order.booking.eventDate).toISOString().split("T")[0];
    await DailyCount.findOneAndUpdate(
      { date: new Date(eventDate) },
      {
        $inc: {
          totalBookings: -1,
          totalGuests: -parseInt(order.booking.guestCount),

        },
      },
      { upsert: true, new: true }
    );

         
      }
  
      res.json({ message: 'Order status and item statuses updated', updatedStatus: order.refundStatus });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  const itemStatus = async (req, res) => {
  const { orderId, itemId, status } = req.body;
  const userId = req.session.user_id;

  try {
    // Step 1: Update the item's refundStatus
    await Order.updateOne(
      { _id: orderId, 'items._id': itemId },
      { $set: { 'items.$.refundStatus': status } }
    );

    // Step 2: If approved, process refund
    if (status === 'approved') {
      const wallet = await Wallet.findOne({ user: userId });

      if (!wallet) {
        return res.status(400).json({ message: 'Wallet not found' });
      }

      const order = await Order.findOne({ _id: orderId });
      const item = order.items.find(item => item._id.toString() === itemId);

      if (!item) {
        return res.status(400).json({ message: 'Item not found in order' });
      }

      const itemPrice = item.price;
      const quantity = item.quantity;
      const couponDiscount = item.couponDiscount || 0;

      const totalRefund = (itemPrice * quantity) - couponDiscount;

      wallet.balance += totalRefund;
      await wallet.save();
    }

    res.json({ updatedStatus: status });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  module.exports= {
    listUserOrders,
    listOrderDetails,
    orderStatus,
    itemStatus

  }