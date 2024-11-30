const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

// Ruta para manejar el envío del formulario de contacto
router.post('/', async (req, res) => {
  const { name, email, message, topic, userId } = req.body;

  // Verificación de campos requeridos
  if (!name || !email || !message || !topic || !userId) {
    return res.status(400).json({ message: 'Faltan campos requeridos.' });
  }

  try {
    const newContact = new Contact({ name, email, message, topic, userId });
    await newContact.save();
    res.status(201).json({ message: 'Mensaje enviado exitosamente' });
  } catch (error) {
    console.error('Error al guardar el contacto:', error); // Imprimir el error en la consola para depurar
    res.status(500).json({ message: 'Error al enviar el mensaje', error: error.message });
  }
});

// Ruta para obtener todos los contactos
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los contactos', error });
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