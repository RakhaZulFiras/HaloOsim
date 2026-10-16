require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

app.set('socketio', io);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/suara', require('./routes/suaraRoutes'));
app.use('/api/nisn', require('./routes/nisnRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Express 5: wildcard harus bernama ('*' saja tidak valid lagi)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Error handler (termasuk error upload dari multer)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  res.status(status).json({ success: false, message: err.message || 'Terjadi kesalahan server' });
});

io.on('connection', () => {
  console.log('Client connected via Realtime Socket');
});

connectDB().then((r) => {
  if (!r.success) console.warn('Server tetap berjalan, tetapi database belum terhubung.');
  server.listen(PORT, () => console.log(`HaloOsim Server Running on Port ${PORT}`));
});
