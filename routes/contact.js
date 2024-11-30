// routes/contact.js
const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');  // Importa el modelo correctamente

// Ruta para manejar el formulario de contacto
router.post('/', async (req, res) => {
  const { name, email, message, topic, userId } = req.body;
  
  // Verificar si falta algún campo requerido
  if (!name || !email || !message || !topic || !userId) {
    console.log("Campos faltantes en la solicitud:", { name, email, message, topic, userId });
    return res.status(400).json({ message: 'Faltan campos requeridos.' });
  }

  try {
    console.log("Guardando contacto con los siguientes datos:", { name, email, message, topic, userId });

    // Crear un nuevo contacto y guardarlo
    const newContact = new Contact({ name, email, message, topic, userId });
    await newContact.save();
    console.log("Contacto guardado exitosamente:", newContact);

    res.status(201).json({ message: 'Mensaje enviado exitosamente' });
  } catch (error) {
    console.error('Error al guardar el contacto:', error.message); 
    console.error('Stack trace del error:', error.stack);
    res.status(500).json({ message: 'Error al enviar el mensaje', error: error.message });
  }
});

// Ruta para obtener todos los contactos
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find();
    console.log("Contactos obtenidos:", contacts);
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error al obtener contactos:", error.message);
    console.error("Stack trace del error:", error.stack);
    res.status(500).json({ message: 'Error al obtener los contactos', error });
  }
});

// Ruta para obtener un contacto por ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      console.log("Contacto no encontrado con ID:", req.params.id);
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    console.log("Contacto encontrado:", contact);
    res.status(200).json(contact);
  } catch (error) {
    console.error("Error al obtener el contacto por ID:", error.message);
    console.error("Stack trace del error:", error.stack);
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
      console.log("Contacto no encontrado para actualizar con ID:", req.params.id);
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    console.log("Contacto actualizado:", updatedContact);
    res.status(200).json(updatedContact);
  } catch (error) {
    console.error("Error al actualizar el contacto:", error.message);
    console.error("Stack trace del error:", error.stack);
    res.status(500).json({ message: 'Error al actualizar el contacto', error });
  }
});

// Ruta para eliminar un contacto
router.delete('/:id', async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      console.log("Contacto no encontrado para eliminar con ID:", req.params.id);
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    console.log("Contacto eliminado:", deletedContact);
    res.status(200).json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error("Error al eliminar el contacto:", error.message);
    console.error("Stack trace del error:", error.stack);
    res.status(500).json({ message: 'Error al eliminar el contacto', error });
  }
});

module.exports = router;