const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { conectar, obtenerBaseDatos } = require('./db');
const { ObjectId } = require('mongodb'); // ← Aquí correctamente arriba
const app = express();
const port = 3000;

// Configuración básica
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'secreto-tallercontrolpro',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static('views'));

// Importar routers
const clientesRouter = require('./routes/clientes');
const loginRouter = require('./routes/login');

// Usar routers
app.use('/clientes', clientesRouter);
app.use('/login', loginRouter);

// 👉 Función para generar un nuevo ID (solo para archivos JSON, ya no la usamos realmente)
function generarNuevoID(callback) {
  fs.readFile('./ultimoID.json', (err, data) => {
    if (err) {
      console.error('Error al leer ultimoID.json:', err);
      return callback(null);
    }
    let { ultimoID } = JSON.parse(data);
    ultimoID++;
    const nuevoID = `P-${ultimoID.toString().padStart(5, '0')}`;

    fs.writeFile('./ultimoID.json', JSON.stringify({ ultimoID }), (err) => {
      if (err) {
        console.error('Error al guardar nuevo ID:', err);
        return callback(null);
      }
      callback(nuevoID);
    });
  });
}

// 🔥 Rutas:

// Guardar costos
app.post('/costos', (req, res) => {
  const { costoPintura, costoDesabolladura } = req.body;
  const nuevosCostos = { costoPintura, costoDesabolladura };

  fs.writeFile('./costos.json', JSON.stringify(nuevosCostos), (err) => {
    if (err) {
      console.error('Error al guardar costos:', err);
      return res.status(500).send('Error al guardar costos');
    }
    res.send('Costos guardados correctamente');
  });
});

// Leer costos
app.get('/costos', (req, res) => {
  fs.readFile('./costos.json', (err, data) => {
    if (err) {
      console.error('Error al leer costos:', err);
      return res.status(500).send('Error al leer costos');
    }
    const costos = JSON.parse(data);
    res.json(costos);
  });
});

// Obtener todos los pedidos
app.get('/pedidos', async (req, res) => {
  try {
    const db = obtenerBaseDatos();
    const pedidos = await db.collection('pedidos').find().toArray();
    res.json(pedidos);
  } catch (error) {
    console.error('Error al leer pedidos:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Guardar nuevo pedido
app.post('/pedidos', async (req, res) => {
  try {
    const db = obtenerBaseDatos();

    const count = await db.collection('pedidos').countDocuments();
    const nuevoID = `P-${(count + 1).toString().padStart(5, '0')}`;

    const nuevoPedido = {
      id: nuevoID,
      ...req.body
    };

    await db.collection('pedidos').insertOne(nuevoPedido);
    res.send('Pedido guardado correctamente');
  } catch (error) {
    console.error('Error al guardar pedido:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Editar pedido
app.post('/editarPedido', async (req, res) => {
  const { id, cambios } = req.body;

  try {
    const db = obtenerBaseDatos();
    const pedido = await db.collection('pedidos').findOne({ id });

    if (!pedido) {
      return res.status(404).send('Pedido no encontrado');
    }

    await db.collection('pedidos').updateOne({ id }, { $set: cambios });

    if (['nombre', 'rut', 'telefono', 'correo'].some(key => cambios.hasOwnProperty(key))) {
      await db.collection('clientes').updateOne(
        { rut: pedido.rut },
        { $set: {
          ...(cambios.nombre && { nombre: cambios.nombre }),
          ...(cambios.rut && { rut: cambios.rut }),
          ...(cambios.telefono && { telefono: cambios.telefono }),
          ...(cambios.correo && { correo: cambios.correo })
        }}
      );
    }

    res.send('Actualizado correctamente');
  } catch (error) {
    console.error('Error al editar pedido:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Eliminar pedido
app.post('/eliminarPedido', async (req, res) => {
  const { id } = req.body;

  try {
    const db = obtenerBaseDatos();
    await db.collection('pedidos').deleteOne({ id });
    res.send('Pedido eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).send('Error en el servidor');
  }
});

// 🔥 Iniciar servidor
app.listen(port, async () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  await conectar(); // Conectarse a MongoDB Atlas
});
