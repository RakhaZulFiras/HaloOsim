const mongoose = require('mongoose');
const { connectDB, checkCollections, REQUIRED_COLLECTIONS } = require('../config/db');

exports.checkStatus = async (req, res) => {
  res.json(await checkCollections());
};

exports.saveConfig = async (req, res) => {
  const uri = String(req.body.uri || '').trim();
  if (!uri) return res.status(400).json({ success: false, message: 'URI wajib diisi' });

  const result = await connectDB(uri);
  if (result.success) {
    res.json({ success: true, ...(await checkCollections()) });
  } else {
    res.status(400).json({ success: false, message: result.error });
  }
};

exports.autocreateCollections = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database belum terhubung' });
    }
    const existing = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
    for (const name of REQUIRED_COLLECTIONS) {
      if (!existing.includes(name)) await mongoose.connection.db.createCollection(name);
    }
    // Tidak ada data dummy: login hanya untuk NISM hasil upload
    res.json({ success: true, message: 'Collection berhasil dibuat!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
