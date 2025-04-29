const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://severinorepuestoschile:samurai1351@cluster0.dfsczk0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function conectar() {
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB:', error);
  }
}

function obtenerBaseDatos() {
  return client.db('TallerControlPRO'); // ← este es el nombre de tu base creada en Atlas
}

module.exports = { conectar, obtenerBaseDatos };
