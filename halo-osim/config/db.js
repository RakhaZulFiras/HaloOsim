const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const REQUIRED_COLLECTIONS = ['suara_siswa', 'DataSiswa'];

let currentUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/halo_osim_db';

const getCurrentUri = () => currentUri;

// Sembunyikan password agar tidak bocor ke browser
const maskUri = (uri) => uri.replace(/\/\/([^:@/]+):([^@]+)@/, '//$1:****@');

// Update hanya baris MONGODB_URI di .env (variabel lain tidak ditimpa)
const persistUri = (uri) => {
  try {
    let lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
    lines = lines.filter((l) => l.trim() && !l.startsWith('MONGODB_URI='));
    lines.push(`MONGODB_URI=${uri}`);
    fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
  } catch (err) {
    console.warn('Gagal menyimpan URI ke .env:', err.message);
  }
};

const connectDB = async (customUri = null) => {
  try {
    const uri = customUri || currentUri;
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    currentUri = uri;
    process.env.MONGODB_URI = uri;
    if (customUri) persistUri(uri);
    console.log(`MongoDB Connected: ${mongoose.connection.host} / db: ${mongoose.connection.name}`);
    return { success: true };
  } catch (error) {
    console.error(`Error Connecting DB: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const checkCollections = async () => {
  const shown = maskUri(currentUri);
  try {
    if (mongoose.connection.readyState !== 1) {
      return { connected: false, currentUri: shown, missingCollections: [...REQUIRED_COLLECTIONS] };
    }
    const names = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
    return {
      connected: true,
      currentUri: shown,
      missingCollections: REQUIRED_COLLECTIONS.filter((c) => !names.includes(c))
    };
  } catch (error) {
    return { connected: false, currentUri: shown, error: error.message, missingCollections: [...REQUIRED_COLLECTIONS] };
  }
};

module.exports = { connectDB, checkCollections, getCurrentUri, REQUIRED_COLLECTIONS };
