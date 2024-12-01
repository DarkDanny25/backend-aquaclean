const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Subscription = require('../models/push');

// Ruta para registrar o actualizar la suscripción
router.post('/subscribe', async (req, res) => {
  const { subscriptionId, endpoint, expirationTime, keys } = req.body;

  if (!subscriptionId || !endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({
      message: 'Faltan datos requeridos para registrar la suscripción.',
    });
  }

  try {
    let existingSubscription = await Subscription.findOne({ subscriptionId });

    if (existingSubscription) {
      existingSubscription.endpoint = endpoint;
      existingSubscription.expirationTime = expirationTime;
      existingSubscription.keys = keys;
      await existingSubscription.save();
      return res.status(200).json({ message: 'Suscripción actualizada correctamente' });
    }

    const newSubscription = new Subscription({
      subscriptionId,
      endpoint,
      expirationTime,
      keys,
    });

    await newSubscription.save();
    res.status(201).json({ message: 'Suscripción registrada con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor al registrar la suscripción' });
  }
});

// Ruta para enviar una notificación push a un usuario específico
router.post('/send-notification', async (req, res) => {
  const { subscriptionId, title, message } = req.body;

  if (!subscriptionId || !title || !message) {
    return res.status(400).json({
      message: 'Faltan datos requeridos para enviar la notificación.',
    });
  }

  try {
    const subscription = await Subscription.findOne({ subscriptionId });

    if (!subscription) {
      return res.status(404).json({ message: 'Suscripción no encontrada' });
    }

    const payload = JSON.stringify({ title, message });

    try {
      await webpush.sendNotification(subscription, payload);
      res.status(200).json({ message: 'Notificación enviada correctamente' });
    } catch (err) {
      if (err.statusCode === 410) {
        await Subscription.deleteOne({ _id: subscription._id });
        res.status(410).json({ message: 'Suscripción caducada, eliminada' });
      } else {
        res.status(500).json({ message: 'Error al enviar la notificación push' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al enviar la notificación' });
  }
});

module.exports = router;