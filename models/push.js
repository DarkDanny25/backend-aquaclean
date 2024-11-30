const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  endpoint: { type: String, required: true },
  expirationTime: { type: Number, required: false },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;