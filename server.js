const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const contactRoutes = require("./routes/contact");
const userRoutes = require("./routes/user");
const pushRoutes = require("./routes/push");
const webpush = require("web-push");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS con tu dominio en producción
app.use(
  cors({
    origin: ["https://aquaclean-app.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Configurar claves VAPID
webpush.setVapidDetails(
  "mailto:edanuc15@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Ruta raíz amigable
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido al backend de AquaClean",
    info: "Este es un servicio API para gestionar contactos, usuarios y suscripciones.",
    routes: {
      "/api/contact": "Ruta para obtener y agregar contactos.",
      "/api/user": "Ruta para manejar usuarios (registro, login).",
      "/api/push": "Ruta para gestionar suscripciones de notificaciones push.",
    },
    note: "Para más detalles sobre cómo usar la API, consulta la documentación.",
  });
});

// Rutas
app.use("/api/contact", contactRoutes);
app.use("/api/user", userRoutes);
app.use("/api/push", pushRoutes);

app.listen(PORT, () => {
  console.log(`Backend corriendo en el puerto: ${PORT}`);
});