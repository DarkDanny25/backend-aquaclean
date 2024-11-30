const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Subscription = require('../models/push');

// Ruta para registrar la suscripción
router.post('/subscribe', async (req, res) => {
  const { subscriptionId, endpoint, expirationTime, keys } = req.body;

  try {
    // Verificar si ya existe una suscripción para ese subscriptionId
    let existingSubscription = await Subscription.findOne({ subscriptionId });

    // Si existe, no crear una nueva, solo actualizar la suscripción
    if (existingSubscription) {
      existingSubscription.endpoint = endpoint;
      existingSubscription.expirationTime = expirationTime;
      existingSubscription.keys = keys;
      await existingSubscription.save();
      return res.status(200).json({ message: 'Suscripción actualizada' });
    }

    // Si no existe, crear una nueva suscripción
    const newSubscription = new Subscription({
      subscriptionId,
      endpoint,
      expirationTime,
      keys,
    });

    await newSubscription.save();
    res.status(201).json({ message: 'Suscripción registrada con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar la suscripción' });
  }
});

// Ruta para enviar la notificación push a un usuario específico
router.post('/send-notification', async (req, res) => {
  const { subscriptionId, title, message } = req.body;

  try {
    // Buscar la suscripción de un usuario por subscriptionId
    const subscription = await Subscription.findOne({ subscriptionId });

    if (!subscription) {
      return res.status(404).json({ message: 'Suscripción no encontrada' });
    }

    // Crear el payload de la notificación
    const payload = JSON.stringify({
      title: title,
      message: message,
    });

    // Enviar la notificación al usuario específico
    try {
      await webpush.sendNotification(subscription, payload);
      res.status(200).json({ message: 'Notificación enviada' });
    } catch (err) {
      if (err.statusCode === 410) {
        // Si la suscripción ya no es válida, eliminarla
        await Subscription.deleteOne({ _id: subscription._id });
        res.status(410).json({ message: 'Suscripción caducada, eliminada' });
      } else {
        res.status(500).json({ message: 'Error al enviar la notificación' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al enviar la notificación' });
  }
});

module.exports = router;