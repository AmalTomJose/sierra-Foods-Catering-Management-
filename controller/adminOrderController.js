  const User  = require('../models/userSchema');
  const Booking = require('../models/bookingModel');
  const Order = require('../models/orderModel');
  const Cart = require('../models/cartModel');
  const Product = require('../models/itemModel');
  const dateFun = require('../config/dateData');
  

  const listUserOrders = async (req, res) => {
    try {
        console.log('hii')
      const admin = req.session.adminData;
      const page = parseInt(req.query.page) || 1;
      const pageSize = 7;
  
      const totalCount = await Order.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);
  
      const pipeline = [
        {
          $sort: { _id: -1 }
        },
        {
          $skip: (page - 1) * pageSize
        },
        {
          $limit: pageSize
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "bookings",
            localField: "address",
            foreignField: "_id",
            as: "address" 
          }
        },
        { $unwind: "$address" },
        {
          $unwind: "$items"
        },
        {
          $lookup: {
            from: "items",
            localField: "items.product",
            foreignField: "_id",
            as: "items.product"
          }
        },
        {
          $unwind: "$items.product"
        },
        {
          $group: {
            _id: "$_id",
            orderId: { $first: "$orderId" },
            user: { $first: "$user" },
            address: { $first: "$address" },
            orderDate: { $first: "$orderDate" },
            deliveryDate: { $first: "$deliveryDate" },
            paymentMethod: { $first: "$paymentMethod" },
            totalAmount:{$first:'$totalAmount'},
            status: { $first: "$status" },
            items: { $push: "$items" }
          }
        },
        {
          $sort: { orderDate: -1 }
        }
      ];
  
      const orders = await Order.aggregate(pipeline);
  console.log(orders)
      res.render("admin/allOrder", {
        order: orders,
        currentPage: page,
        totalPages
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
                path: "address",
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
        res.render("admin/orderDetails", { order });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
  };
  
  



  module.exports= {
    listUserOrders,
    listOrderDetails

  }