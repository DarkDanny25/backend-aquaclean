// routes/push.js
const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Subscription = require('../models/push');  // Importa el modelo correctamente

// Ruta para registrar la suscripción
router.post('/subscribe', async (req, res) => {
  const { subscription, userId } = req.body;

  if (!userId) {
    console.log("Falta el userId en la suscripción:", req.body);
    return res.status(400).json({ message: 'userId es requerido' });
  }

  try {
    console.log("Suscripción recibida:", subscription);
    console.log("userId recibido:", userId);

    // Verificar si ya existe una suscripción para el mismo userId y endpoint
    const existingSubscription = await Subscription.findOne({
      userId,
      endpoint: subscription.endpoint,
    });

    if (existingSubscription) {
      console.log("Suscripción ya registrada para este userId:", userId);
      return res.status(200).json({ message: 'Suscripción ya registrada' });
    }

    // Guardar nueva suscripción asociada al userId
    const newSubscription = new Subscription({
      ...subscription,
      userId,
    });
    await newSubscription.save();
    console.log("Suscripción guardada con éxito:", newSubscription);

    res.status(201).json({ message: 'Suscripción registrada con éxito' });
  } catch (err) {
    console.error("Error al registrar la suscripción:", err.message);
    console.error("Stack trace del error:", err.stack);
    res.status(500).json({ message: 'Error al registrar la suscripción' });
  }
});

// Ruta para enviar la notificación push
router.post('/send-notification', async (req, res) => {
  const { title, message, userId } = req.body;

  if (!userId) {
    console.log("Falta el userId al intentar enviar la notificación:", req.body);
    return res.status(400).json({ message: 'userId es requerido' });
  }

  try {
    // Buscar suscripciones asociadas al userId
    const subscriptions = await Subscription.find({ userId });

    if (subscriptions.length === 0) {
      console.log("No hay suscripciones registradas para el userId:", userId);
      return res.status(404).json({ message: 'No hay suscripciones registradas para este usuario' });
    }

    console.log("Suscripciones encontradas para el userId:", subscriptions.length);

    for (const subscription of subscriptions) {
      const payload = JSON.stringify({
        title: title,
        message: message,
      });

      try {
        console.log("Enviando notificación a:", subscription.endpoint);
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        // Eliminar suscripciones inválidas
        if (err.statusCode === 410) {
          console.log("Suscripción inválida detectada, eliminando...");
          await Subscription.deleteOne({ _id: subscription._id });
        } else {
          console.error("Error al enviar la notificación:", err.message);
          console.error("Stack trace del error:", err.stack);
        }
      }
    }

    res.status(200).json({ message: 'Notificaciones enviadas' });
  } catch (err) {
    console.error("Error al enviar notificaciones:", err.message);
    console.error("Stack trace del error:", err.stack);
    res.status(500).json({ message: 'Error al enviar las notificaciones' });
  }
});

module.exports = router;