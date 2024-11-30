const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Subscription = require('../models/push');

// Ruta para registrar la suscripción
router.post('/subscribe', async (req, res) => {
  const { subscription, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId es requerido' });
  }

  try {
    console.log("Suscripción recibida:", subscription); // Depuración
    console.log("userId:", userId); // Depuración

    // Verificar si ya existe una suscripción para el mismo userId y endpoint
    const existingSubscription = await Subscription.findOne({
      userId,
      endpoint: subscription.endpoint,
    });

    if (existingSubscription) {
      return res.status(200).json({ message: 'Suscripción ya registrada' });
    }

    // Guardar nueva suscripción asociada al userId
    const newSubscription = new Subscription({
      ...subscription,
      userId,
    });
    await newSubscription.save();

    res.status(201).json({ message: 'Suscripción registrada con éxito' });
  } catch (err) {
    console.error("Error al registrar suscripción:", err); // Depuración
    res.status(500).json({ message: 'Error al registrar la suscripción' });
  }
});

// Ruta para enviar la notificación push
router.post('/send-notification', async (req, res) => {
  const { title, message, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId es requerido' });
  }

  try {
    // Buscar suscripciones asociadas al userId
    const subscriptions = await Subscription.find({ userId });

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No hay suscripciones registradas para este usuario' });
    }

    console.log("Suscripciones encontradas:", subscriptions); // Depuración

    for (const subscription of subscriptions) {
      const payload = JSON.stringify({
        title: title,
        message: message,
      });

      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        // Eliminar suscripciones inválidas
        if (err.statusCode === 410) {
          await Subscription.deleteOne({ _id: subscription._id });
        }
      }
    }

    res.status(200).json({ message: 'Notificaciones enviadas' });
  } catch (err) {
    console.error("Error al enviar notificaciones:", err); // Depuración
    res.status(500).json({ message: 'Error al enviar las notificaciones' });
  }
});

module.exports = router;