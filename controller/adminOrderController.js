  const User  = require('../models/userSchema');
  const Booking = require('../models/bookingModel');
  const Order = require('../models/orderModel');
  const Cart = require('../models/cartModel');
  const Product = require('../models/itemModel');
  const dateFun = require('../config/dateData');
  const Wallet = require('../models/walletModel');
  const DailyCount = require('../models/dailybookingCount')
  const { creditToWallet } = require('./walletController');
  
  
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
  
      const validStatuses = ['requested', 'approved', 'cancelled', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
  
      const order = await Order.findById(orderId).populate('booking');
      if (!order) return res.status(404).json({ message: 'Order not found' });
  
      // Update main refund status
      order.refundStatus = status;
  
      // --------------------------------------------------------
      // 🟢 APPROVED → Refund to wallet + cancel order/items
      // --------------------------------------------------------
      if (status === 'approved') {
        order.items.forEach((item) => {
          item.status = 'cancelled';
          item.refundStatus = 'approved';
        });
  
        const refundAmount = order.finalAmount;
  
        if (refundAmount > 0) {
          await creditToWallet(
            order.user,
            refundAmount,
            order._id,
            'Refund for cancelled order'
          );
        }
  
        // Reverse DailyCount
        const eventDate = new Date(order.booking.eventDate)
          .toISOString()
          .split("T")[0];
  
        await DailyCount.findOneAndUpdate(
          { date: new Date(eventDate) },
          {
            $inc: {
              totalBookings: -1,
              totalGuests: -parseInt(order.booking.guestCount),
            }
          },
          { upsert: true, new: true }
        );
  
        // Mark order fully cancelled
        order.status = 'cancelled';
      }
  
      // --------------------------------------------------------
      // 🔴 REJECTED → No refund, no changes to booking, no wallet
      // --------------------------------------------------------
      if (status === 'rejected') {
        order.items.forEach((item) => {
          item.refundStatus = 'rejected';
        });
  
        // Keep order status as 'completed' (or your normal fulfilled status)
        if (order.status !== 'completed') {
          order.status = 'completed';
        }
      }
  
      await order.save();
  
      return res.json({
        message: 'Order updated successfully',
        updatedStatus: order.refundStatus
      });
  
    } catch (error) {
      console.error("Order Status Error:", error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

  

  const itemStatus = async (req, res) => {
    try {
      const { orderId, itemId, status } = req.body;
  
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
  
      const item = order.items.find((item) => item._id.toString() === itemId);
      if (!item) return res.status(404).json({ message: 'Item not found' });
  
      // Update refund status of selected item
      item.refundStatus = status;
  
      // STEP 1: Approve refund for a single item
      if (status === 'approved') {
        
        // Mark item cancelled
        item.status = 'cancelled';
  
        const itemPrice = item.price;
        const quantity = item.quantity;
        const couponDiscount = item.couponDiscount || 0;
  
        const totalRefund =
          itemPrice * quantity - couponDiscount;
  
        if (totalRefund > 0) {
          await creditToWallet(
            order.user,
            totalRefund,
            order._id,
            'Refund for cancelled item'
          );
        }
      }
  
      // STEP 2: If ALL items are approved → cancel full order
      const allApproved = order.items.every(
        (it) => it.refundStatus === 'approved'
      );
  
      if (allApproved) {
        order.status = 'cancelled';
        order.refundStatus = 'approved';
  
        // Reverse DailyCount bookings
        const fullOrder = await order.populate('booking');
        const eventDate = new Date(fullOrder.booking.eventDate)
          .toISOString()
          .split("T")[0];
  
        await DailyCount.findOneAndUpdate(
          { date: new Date(eventDate) },
          {
            $inc: {
              totalBookings: -1,
              totalGuests: -parseInt(fullOrder.booking.guestCount),
            }
          },
          { upsert: true }
        );
      }
  
      await order.save();
  
      return res.json({ updatedStatus: status });
  
    } catch (error) {
      console.error("Item Status Error:", error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  

  module.exports= {
    listUserOrders,
    listOrderDetails,
    orderStatus,
    itemStatus

  }