const mongoose = require('mongoose');

const SuaraSiswaSchema = new mongoose.Schema({
  nism: { type: String, required: true },
  nama: { type: String, required: true },
  pesan: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SuaraSiswa', SuaraSiswaSchema, 'suara_siswa');
