const express = require('express');
const router = express.Router();
const { obtenerBaseDatos } = require('../db');

// Página de login
router.get('/', (req, res) => {
  res.sendFile('login.html', { root: './views' });
});

// Procesar login
router.post('/', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const db = obtenerBaseDatos();

    // Buscar usuario en la base de datos
    const user = await db.collection('usuarios').findOne({ usuario });

    if (!user || user.password !== password) {
      return res.status(401).send('Usuario o contraseña incorrectos');
    }

    // Guardar sesión
    req.session.usuario = user.usuario;
    req.session.rol = user.rol;
    res.redirect('/dashboard.html');
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Cerrar sesión
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Obtener información del usuario logueado
router.get('/info', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).send('No autenticado');
  }
  res.json({ usuario: req.session.usuario, rol: req.session.rol });
});

module.exports = router;
