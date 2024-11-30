const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Subscription = require('../models/push');

// Ruta para registrar la suscripción
router.post('/subscribe', async (req, res) => {
  const subscription = req.body;
  try {
    const newSubscription = new Subscription(subscription);
    await newSubscription.save();
    res.status(201).json({ message: 'Suscripción registrada con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar la suscripción' });
  }
});

// Ruta para enviar la notificación push
router.post('/send-notification', async (req, res) => {
  const { title, message } = req.body;
  try {
    const subscriptions = await Subscription.find();
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No hay suscripciones registradas' });
    }
    for (const subscription of subscriptions) {
      const payload = JSON.stringify({
        title: title,
        message: message,
      });

  try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        if (err.statusCode === 410) {
          await Subscription.deleteOne({ _id: subscription._id });
        }
      }
    }
    res.status(200).json({ message: 'Notificaciones enviadas' });
  } catch (err) {
    res.status(500).json({ message: 'Error al enviar las notificaciones' });
  }
});

module.exports = router;