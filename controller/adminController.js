const bcrypt = require("bcrypt");
const User = require("../models/userSchema");
const Order = require('../models/orderModel')

const session = require("express-session");
const { loadHomepage } = require("./userController");
const Notification = require('../models/notificationModel');



const updateOrderStatus = async (req, res) => {
  try {
    
    const { orderId, status } = req.body;

    await Order.findByIdAndUpdate(orderId, {
      status: status,
    });

    req.flash('success', 'Order status updated successfully');
    res.redirect('back');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to update order status');
    res.redirect('back');
  }
};



//admin Login//
const   adminLogin = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
  
    res.render("admin/auth/login",{layout:'layouts/mainLayout',title:'admin login',msg:null});
  }  catch (error) {
     console.log(error.message);
  }
};


//  adminVerify
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    console.log(userData);

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.isAdmin == 1) {

          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
          
        } else { 
          res.render("admin/auth/login", {layout:'layouts/mainLayout',title:'admin login', msg: "Admin not Found" });
        }
      } else {
        res.render("admin/auth/login", {layout:'layouts/mainLayout',title:'admin login', msg: "Incorrect Credentials" });
      }
    } else {
      res.render("admin/auth/login", { layout:'layouts/mainLayout',title:'admin login',msg: "Admin not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};








      

const loadUserpage=async (req,res)=>{
  try{
    console.log('hii')
    const adminData = await User.findById(req.session.admin_id);
    const userData = await User.find({isAdmin:0})
    console.log(adminData);
    console.log(userData);
    res.render('admin/dashboard/userDashboard',{users:userData,admin:adminData})
  }catch(error){
    console.error(error.message);
    res.status(500).send("Internal Server Error: " + error.message);
  }
};




const loadHome = async (req, res) => {
  try {
    const totalActiveUsers = await User.countDocuments({ isBlocked: false });
    const totalActiveOrders = await Order.countDocuments({ status: 'confirmed' });

    const totalRevenueData = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const totalRevenue = totalRevenueData[0]?.total || 0;

    res.render('admin/dashboard/dashboard', {
      totalActiveUsers,
      totalActiveOrders,
      totalRevenue
    });
  } catch (error) {
    console.error("Dashboard Render Error:", error);
    res.status(500).send("Error loading dashboard");
  }
};

const getDashboardData = async (req, res) => {
  try {
    const filter = req.query.filter || 'monthly';
    let groupStage;

    if (filter === 'yearly') {
      groupStage = { year: { $year: "$createdAt" } };
    } else {
      groupStage = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
    }

    // 🔹 SALES CHART
    const salesData = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: groupStage,
          totalSales: { $sum: "$finalAmount" },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 🔹 TOP PRODUCTS
    const bestSellingProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          name: "$product.item_name",
          totalSold: 1
        }
      }
    ]);

    // 🔹 TOP CATEGORIES
    const bestSellingCategories = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category._id",
          categoryName: { $first: "$category.cat_name" },
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // 🔹 TOP SUBCATEGORIES
    const bestSellingSubcategories = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "subcategories",
          localField: "product.subcategory",
          foreignField: "_id",
          as: "subcategory"
        }
      },
      { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$subcategory._id",
          subcategoryName: { $first: "$subcategory.subcat_name" },
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      salesData,
      bestSellingProducts,
      bestSellingCategories,
      bestSellingSubcategories
    });
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ error: "Error fetching dashboard data" });
  }
};



const listUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const pageSize = 10; // Number of items per page
    const skip = (page - 1) * pageSize;

    const id = req.query.id;
    const Uservalue = await User.findById(id);

    if (Uservalue.isBlocked==1) {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            isBlocked: 0,
          },
        }
      );
      if (req.session.user_id) delete req.session.user_id;
    } else {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            isBlocked: 1,
          },
        }
      );
    }

    // Fetch paginated user data
    const paginatedUserData = await User.find({})
      .skip(skip)
      .limit(pageSize);

    res.redirect("/admin/userDashboard");
    
  } catch (error) {
    console.log(error.message);
  }
};



const adminLogout = async (req, res) => {
  try {

  
    delete req.session.admin_id;
 
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  
  }
};




const viewNotifications = async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });

  res.render('admin/notification/notifications', {
    notifications,
    layout: 'layouts/admin',
    title: 'Notifications'
  });
};

const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ isRead: false }, { isRead: true });
  res.redirect('/admin/notifications');
};

const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ isRead: false });
  res.json({ count });
};





const getSalesReport = async (req, res) => {
  try {
    let { filterType, startDate, endDate } = req.query;

    let match = { status: 'Delivered' }; // Only count delivered orders

    // Filter by date
    const now = new Date();
    switch (filterType) {
      case 'daily':
        match.createdAt = {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lte: new Date()
        };
        break;
      case 'weekly':
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        match.createdAt = { $gte: startOfWeek, $lte: new Date() };
        break;
      case 'monthly':
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        match.createdAt = { $gte: firstDay, $lte: new Date() };
        break;
      case 'custom':
        if (startDate && endDate) {
          match.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        break;
    }

    const salesData = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: '$totalAmount' },
          couponDiscount: { $sum: '$couponDiscount' },
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalSales: 1,
          couponDiscount: 1,
     
          totalDiscount: { $add: ['$couponDiscount'] },
          netRevenue: {
            $subtract: ['$totalSales', { $add: ['$couponDiscount', '$offerDiscount'] }]
          }
        }
      }
    ]);

    res.render('admin/dashboard/salesReport', {
     
      salesData: salesData[0] || {},
      filterType,
      startDate,
      endDate
    });
  } catch (err) {
    console.log('❌ Error generating report:', err);
    res.redirect('/admin/dashboard');
  }
};





module.exports = {
  adminLogin ,
  verifyLogin,
  adminLogout,
  loadHome,
  getDashboardData,
  loadUserpage,
  listUser,
  viewNotifications,
  markAllAsRead,
  getUnreadCount,
  updateOrderStatus,
  getSalesReport

  
};