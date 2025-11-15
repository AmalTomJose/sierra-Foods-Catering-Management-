const Wallet = require('../models/walletModel');
// Credit money to wallet
const creditToWallet = async (userId, amount, orderId, description) => {
    try {
      return await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              type: 'credit',
              amount,
              orderId,
              description
            }
          }
        },
        { new: true, upsert: true }
      );
    } catch (err) {
      console.error('Error crediting to wallet:', err);
    }
  };
  
  // Debit money from wallet
  const debitFromWallet = async (userId, amount, orderId, description) => {
    try {
      return await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: -amount },
          $push: {
            transactions: {
              type: 'debit',
              amount,
              orderId,
              description
            }
          }
        },
        { new: true }
      );
    } catch (err) {
      console.error('Error debiting from wallet:', err);
    }
  };
  
  
module.exports = {
    creditToWallet,
    debitFromWallet
}
  
