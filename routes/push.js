const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Subscription = require('../models/push');

// Ruta para registrar o actualizar la suscripción
router.post('/subscribe', async (req, res) => {
  const { subscriptionId, endpoint, expirationTime, keys } = req.body;

  console.log('Datos recibidos en /subscribe:', req.body);  // Imprime los datos que llegan al backend

  try {
    // Verificar si ya existe una suscripción con el mismo subscriptionId
    let existingSubscription = await Subscription.findOne({ subscriptionId });

    if (existingSubscription) {
      // Si existe, actualizamos la suscripción
      existingSubscription.endpoint = endpoint;
      existingSubscription.expirationTime = expirationTime;
      existingSubscription.keys = keys;
      await existingSubscription.save();
      return res.status(200).json({ message: 'Suscripción actualizada correctamente' });
    }

    // Si no existe, creamos una nueva suscripción
    const newSubscription = new Subscription({
      subscriptionId,
      endpoint,
      expirationTime,
      keys,
    });

    await newSubscription.save();
    res.status(201).json({ message: 'Suscripción registrada con éxito' });
  } catch (err) {
    console.error('Error al registrar la suscripción:', err);  // Muestra el error detallado en los logs
    res.status(500).json({ message: 'Error interno del servidor al registrar la suscripción' });
  }
});

// Ruta para enviar una notificación push a un usuario específico
router.post('/send-notification', async (req, res) => {
  const { subscriptionId, title, message } = req.body;

  console.log('Datos recibidos en /send-notification:', req.body);  // Imprime los datos que llegan al backend

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

    // Intentar enviar la notificación
    try {
      await webpush.sendNotification(subscription, payload);
      res.status(200).json({ message: 'Notificación enviada correctamente' });
    } catch (err) {
      // Si la suscripción es inválida (status 410), eliminamos la suscripción
      if (err.statusCode === 410) {
        await Subscription.deleteOne({ _id: subscription._id });
        res.status(410).json({ message: 'Suscripción caducada, eliminada' });
      } else {
        console.error('Error al enviar la notificación push:', err);  // Muestra el error detallado
        res.status(500).json({ message: 'Error al enviar la notificación push' });
      }
    }
  } catch (err) {
    console.error('Error al buscar la suscripción:', err);  // Muestra el error detallado
    res.status(500).json({ message: 'Error al enviar la notificación' });
  }
});

module.exports = router;