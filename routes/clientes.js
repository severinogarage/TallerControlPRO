const express = require('express');
const router = express.Router();
const { obtenerBaseDatos } = require('../db');

// Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const db = obtenerBaseDatos();
    const clientes = await db.collection('clientes').find().toArray();
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Agregar nuevo cliente
router.post('/agregar', async (req, res) => {
  try {
    const { nombre, rut, telefono, correo } = req.body;
    const db = obtenerBaseDatos();

    // Verifica si el cliente ya existe por RUT
    const clienteExistente = await db.collection('clientes').findOne({ rut });
    if (clienteExistente) {
      return res.status(400).send('El cliente ya está registrado');
    }

    await db.collection('clientes').insertOne({ nombre, rut, telefono, correo });
    res.send('Cliente agregado correctamente');
  } catch (error) {
    console.error('Error al agregar cliente:', error);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
