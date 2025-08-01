const Coupon = require('../models/coupenModel');

const applyCoupon = async (req, res) => {
  const { code ,finalAmountValue} = req.body;
  const userId = req.session.user_id;

  const coupon = await Coupon.findOne({ code });
  if (!coupon) return res.json({ success: false, message: 'Invalid coupon code' });

  const now = new Date();
  if (coupon.expiryDate < now) return res.json({ success: false, message: 'Coupon expired' });
  if (coupon.usedBy.includes(userId)) return res.json({ success: false, message: 'Coupon already used' });


  // Later you can check cart subtotal here if needed
  console.log('the final amount value is:',finalAmountValue)
  const discount = coupon.discountType === 'percentage'
  ? (finalAmountValue * coupon.discountValue) / 100
  : coupon.discountValue;
  console.log('the discount for the coupon is :',discount)


  res.json({ success: true, coupon, discount });
};

module.exports = { applyCoupon };
