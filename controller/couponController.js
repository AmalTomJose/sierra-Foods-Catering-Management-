const Coupon = require('../models/coupenModel');

const applyCoupon = async (req, res) => {
  try {
    const { code, finalAmountValue } = req.body;
    const userId = req.session.user_id;

    // 1️⃣ Find the coupon
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return res.json({ success: false, message: 'Invalid coupon code' });
    }

    // 2️⃣ Validate coupon
    const now = new Date();
    if (coupon.expiryDate < now) {
      return res.json({ success: false, message: 'Coupon expired' });
    }

    // Optional: if coupon has a start date or active status, check them here
    if (coupon.minOrderAmount && finalAmountValue < coupon.minOrderAmount) {
      return res.json({
        success: false,
        message: `Minimum order amount must be ₹${coupon.minOrderAmount}`,
      });
    }

    // 3️⃣ Check if user has already used it (only once per user)
    if (coupon.usedBy.includes(userId)) {
      return res.json({ success: false, message: 'You have already used this coupon' });
    }

    // 4️⃣ Calculate discount
    const discount =
      coupon.discountType === 'percentage'
        ? Math.min((finalAmountValue * coupon.discountValue) / 100, finalAmountValue)
        : Math.min(coupon.discountValue, finalAmountValue);



    // Just return success with coupon data
    return res.json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount,
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.json({ success: false, message: 'Server error while applying coupon' });
  }
};

const getAvailableCoupons = async (req, res) => {
  try {
    console.log('Requested for coupons');
    const today = new Date();

    // Find valid coupons
    const coupons = await Coupon.find({
      expiryDate: { $gte: today }, // valid expiry
      minOrderAmount: { $lte: req.body.cartTotal || 0 } // eligible for current total
    }).select('code discountType discountValue minOrderAmount expiryDate');

    if (!coupons.length) {
      return res.json({ success: true, coupons: [] });
    }

    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.json({ success: false, message: 'Failed to fetch coupons.' });
  }
};


module.exports = { applyCoupon ,
   getAvailableCoupons
  };
