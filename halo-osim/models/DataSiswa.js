const mongoose = require('mongoose');

const DataSiswaSchema = new mongoose.Schema({
  nism: { type: String, required: true, unique: true, trim: true },
  nama: { type: String, required: true, trim: true }
}, { timestamps: true });

// Collection: DataSiswa
module.exports = mongoose.model('DataSiswa', DataSiswaSchema, 'DataSiswa');
