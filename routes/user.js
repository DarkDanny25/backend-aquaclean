const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const verifyToken = require('../middleware/auth');
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya está registrado' });
    }

    const role = email.endsWith('@aquaclean.io') ? 'admin' : 'user';
    const newUser = new User({ name, email, password, role });
    await newUser.save();

    if (role === 'admin') {
      return res.status(201).json({ message: 'Usuario registrado exitosamente', role: 'admin' });
    } else {
      return res.status(201).json({ 
        message: 'Registro exitoso, pero no tienes acceso al área administrativa. Por favor, usa un correo de dominio @aquaclean.io para acceder.',
        role: 'user' 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el registro', error });
  }
});

// Inicio de sesión de usuario
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    res.status(200).json({ message: 'Login exitoso', token, user: { name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el login', error });
  }
});

// Ruta para contraseña olvidada
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    res.status(200).json({
      message: 'Token generado exitosamente',
      resetToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al generar el token', error });
  }
});

// Ruta para restablecer contraseña
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'El token ha expirado' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    res.status(400).json({ message: 'Token inválido o expirado', error });
  }
});

// Obtener perfil del usuario
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error });
  }
});

// Actualizar perfil del usuario
router.put('/profile', verifyToken, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    user.name = name || user.name;
    user.email = email || user.email;
    if (password) {
      user.password = password;
    }
    await user.save();
    res.status(200).json({ message: 'Perfil actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil', error });
  }
});

// Eliminar cuenta del usuario
router.delete('/delete-account', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al eliminar la cuenta' });
  }
});

module.exports = router;