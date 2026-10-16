const mongoose = require('mongoose');
const SuaraSiswa = require('../models/SuaraSiswa');
const DataSiswa = require('../models/DataSiswa');

exports.postSuara = async (req, res) => {
  try {
    const nism = String(req.body.nism ?? req.body.nisn ?? '').trim();
    const pesan = String(req.body.pesan ?? '').trim();
    if (!nism || !pesan) {
      return res.status(400).json({ success: false, message: 'NISM dan pesan wajib diisi' });
    }

    // Crosscheck NISM ke database; nama diambil dari DB (bukan dari client)
    const siswa = await DataSiswa.findOne({ nism }).lean();
    if (!siswa) {
      return res.status(403).json({ success: false, message: 'NISM tidak terdaftar di database.' });
    }

    const newSuara = await SuaraSiswa.create({ nism: siswa.nism, nama: siswa.nama, pesan });

    const io = req.app.get('socketio');
    if (io) io.emit('new-suara', newSuara);

    res.json({ success: true, message: 'Suara berhasil dikirim!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSuara = async (req, res) => {
  try {
    const listSuara = await SuaraSiswa.find().sort({ createdAt: -1 });
    res.json({ success: true, data: listSuara });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSingleSuara = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID aspirasi tidak valid' });
    }
    const deleted = await SuaraSiswa.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Aspirasi tidak ditemukan' });

    const io = req.app.get('socketio');
    if (io) io.emit('suara-deleted', { id });

    res.json({ success: true, message: 'Aspirasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAllSuara = async (req, res) => {
  try {
    await SuaraSiswa.deleteMany({});
    const io = req.app.get('socketio');
    if (io) io.emit('clear-suara');

    res.json({ success: true, message: 'Semua aspirasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const listSuara = await SuaraSiswa.find().sort({ createdAt: -1 });
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    let csv = '\uFEFFID,NISM,Nama,Waktu,Pesan\n';
    listSuara.forEach((i) => {
      csv += [q(i._id), q(i.nism || i.nisn), q(i.nama), q(i.createdAt.toISOString()), q(i.pesan)].join(',') + '\n';
    });
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('suara_siswa_halo_osim.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
