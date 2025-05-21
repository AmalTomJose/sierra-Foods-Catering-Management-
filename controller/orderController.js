const User = require('../models/userSchema');
const Booking  = require('../models/bookingModel');
const Address = require('../models/addressModel');
const  Cart = require('../models/cartModel');
const Product = require('../models/cartModel');
const Order = require('../models/orderModel')
const  mongoose = require('mongoose')


const loadCheckout = async(req,res)=>{
    try{
        const orderId = req.query.orderId;

        if(orderId){

        }
        else{
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

             const productTotal = cartItems.map(item => {
                const price = item.product.discount_price;
                return price * item.quantity;
            });
            
            // Calculate subtotal
            const subtotal = productTotal.reduce((acc, val) => acc + val, 0);
            
            const shipping = 0; // Or any logic you want
            const subtotalWithShipping = subtotal + shipping;
            console.log('')
            const addressData = await Booking.findOne({user:userId,status:'active'})

            console.log(addressData)
            res.render('user/order/checkout',{user:userId,userData,addressData,cart:cartItems,productTotal,subtotalWithShipping,retryTotal:0,orderId:''})
        }
        


    }
    catch(error)
    {
        console.log(error.message)
    }
}




const checkOutPost = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { address, paymentMethod, retryTotal, amount, paymentStatus } = req.body;
    

    // Validate required fields
    if (!address || !paymentMethod) {
      return res.status(400).json({ sccess: false, error: 'Address and payment method are required.' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty.' });
    }

    // Build order items using discount logic
    const orderItems = cart.items.map((item) => {
      const product = item.product;
      if (!product) throw new Error("Product not found in cart");

      const actualPrice = product.discout_status ? product.discount_price : product.item_price;

      return {
        product: product._id,
        quantity: item.quantity,
        price: actualPrice,
        status: 'Confirmed',
        paymentStatus: paymentStatus || 'Pending',
      };
    });

    console.log(orderItems)
    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    console.log(totalAmount)

    // Create new order
    const newOrder = new Order({
      user: userId,
      address,
      paymentMethod,
      totalAmount: totalAmount, 
      items: orderItems,
    });

    await newOrder.save();

    // Clear the user's cart
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], total: 0 } });

    return res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });

  } catch (err) {
    console.error('Checkout Error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error during checkout' });
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

        console.log(order); // Log the order object to check the coupon information


        // Extract order ID from the order object without re-declaring the variable
        const extractedOrderId = order._id;

        res.render("user/order/orderDetails", {user:userId, userData, order, orderId: extractedOrderId }); // Pass coupon information to the template
    } catch (error) {
        console.log(error.message);
    }
};

const updateCheckout = async (req, res) => {
  try {
    const user = req.session.user_id;
    const bookingId = req.query.id;

    const booking = await Booking.findById(bookingId); // Don't override model name

    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/');
    }

    res.render('user/booking/updateEventDetails', {user, booking });
  } catch (err) {
    console.error('Error loading update page:', err);
    res.status(500).send('Internal Server Error');
  }
};




module.exports = {
    loadCheckout,
    checkOutPost,
    loadOrderDetails,
    loadOrderHistory,
    updateCheckout
}