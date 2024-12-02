const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

// Ruta para manejar el envío del formulario de contacto
router.post('/', async (req, res) => {
  const { name, email, message, topic } = req.body;
  try {
    const newContact = new Contact({ name, email, message, topic });
    await newContact.save();
    res.status(201).json({ message: 'Mensaje enviado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar el mensaje', error });
  }
});

// Ruta para obtener todos los contactos
router.get('/', async (req, res) => {
  const { lastCheckedDate } = req.query; // Fecha del último acceso
  console.log('lastCheckedDate:', lastCheckedDate); // Log para depuración

  try {
    let query = {};
    
    if (lastCheckedDate) {
      console.log('Filtrando contactos con fecha posterior a:', lastCheckedDate); // Log para depuración
      query = { createdAt: { $gt: new Date(lastCheckedDate) } }; // Asegúrate de que createdAt esté disponible en el modelo
    }

    const contacts = await Contact.find(query);
    console.log('Contactos encontrados:', contacts); // Log para depuración

    const newContactsCount = contacts.length;
    console.log('Número de nuevos contactos:', newContactsCount); // Log para depuración

    // Si hay nuevos contactos, enviamos una notificación push
    if (newContactsCount > 0) {
      const subscriptions = await Subscription.find();
      console.log('Enviando notificaciones a las siguientes suscripciones:', subscriptions.length); // Log para depuración

      const title = "Nuevos contactos registrados";
      const messageContent = `¡Hay ${newContactsCount} nuevos contactos!`;

      const promises = subscriptions.map(async (subscription) => {
        const payload = JSON.stringify({
          title,
          body: messageContent,
        });

        try {
          await webpush.sendNotification(subscription, payload);
        } catch (error) {
          console.error('Error al enviar la notificación:', error);
        }
      });

      await Promise.all(promises);
    }

    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error al obtener los contactos:', error);
    res.status(500).json({
      message: 'Error al obtener los contactos',
      error,
    });
  }
});

// Ruta para obtener un contacto por ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el contacto', error });
  }
});

// Ruta para actualizar un contacto
router.put('/:id', async (req, res) => {
  const { name, email, message, topic } = req.body;
  try {
    const updatedContact = await Contact.findByIdAndUpdate(req.params.id, {
      name, email, message, topic
    }, { new: true });

    if (!updatedContact) {
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    res.status(200).json(updatedContact);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el contacto', error });
  }
});

// Ruta para eliminar un contacto
router.delete('/:id', async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    res.status(200).json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el contacto', error });
  }
});

module.exports = router;