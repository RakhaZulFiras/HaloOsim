const mongoose = require('mongoose');
const XLSX = require('xlsx');
const DataSiswa = require('../models/DataSiswa');

const NISM_HEADERS = ['NISM', 'NISN', 'NIS'];
const NAMA_HEADERS = ['NAMA SISWA', 'NAMA', 'NAMA LENGKAP'];

const cellToString = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(0) : '';
  return String(v).trim();
};

const isNism = (s) => /^\d{8,}$/.test(s);
const looksLikeName = (s) => /[A-Za-z]/.test(s) && !/kementerian|nama siswa|^nama$/i.test(s);

// Ambil pasangan {nism, nama} dari satu sheet
function extractFromRows(rows) {
  let nismCol = -1;
  let namaCol = -1;

  // Cari baris header (NISM + NAMA SISWA) di 20 baris pertama
  for (let r = 0; r < Math.min(rows.length, 20) && (nismCol === -1 || namaCol === -1); r++) {
    nismCol = -1;
    namaCol = -1;
    (rows[r] || []).forEach((cell, c) => {
      const v = cellToString(cell).toUpperCase();
      if (NISM_HEADERS.includes(v)) nismCol = c;
      if (NAMA_HEADERS.includes(v)) namaCol = c;
    });
  }

  const result = [];
  for (const row of rows) {
    if (!row) continue;
    let nism = '';
    let nama = '';

    if (nismCol !== -1 && namaCol !== -1) {
      nism = cellToString(row[nismCol]).replace(/\s+/g, '');
      nama = cellToString(row[namaCol]);
    } else {
      // Tanpa header: cari sel angka panjang, nama = sel teks setelahnya
      const cells = row.map(cellToString);
      const idx = cells.findIndex((c) => isNism(c.replace(/\s+/g, '')));
      if (idx !== -1) {
        nism = cells[idx].replace(/\s+/g, '');
        nama = cells.slice(idx + 1).find(looksLikeName) || '';
      }
    }

    nama = nama.replace(/\s+/g, ' ').trim();
    if (isNism(nism) && looksLikeName(nama)) result.push({ nism, nama });
  }
  return result;
}

function readWorkbook(file) {
  const name = file.originalname.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const delim = [';', '\t', ','].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    return XLSX.read(text, { type: 'string', FS: delim });
  }
  return XLSX.read(file.buffer, { type: 'buffer' });
}

exports.getAllStudents = async (req, res) => {
  try {
    const students = await DataSiswa.find().sort({ nama: 1 });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadStudentsBatch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File data siswa belum diunggah' });
    }

    const workbook = readWorkbook(req.file);

    // Gabungkan semua sheet; NISM duplikat -> ambil yang terakhir
    const unique = new Map();
    for (const sheetName of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: '' });
      extractFromRows(rows).forEach((s) => unique.set(s.nism, s.nama));
    }

    if (unique.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data NISM dan Nama siswa valid yang ditemukan di dalam file.'
      });
    }

    const ops = [...unique].map(([nism, nama]) => ({
      updateOne: {
        filter: { nism },
        update: { $set: { nama }, $setOnInsert: { nism } },
        upsert: true
      }
    }));

    let baru = 0;
    let diperbarui = 0;
    for (let i = 0; i < ops.length; i += 1000) {
      const r = await DataSiswa.bulkWrite(ops.slice(i, i + 1000), { ordered: false });
      baru += r.upsertedCount;
      diperbarui += r.modifiedCount;
    }

    res.json({
      success: true,
      message: `Berhasil membaca ${unique.size} siswa: ${baru} data baru, ${diperbarui} diperbarui.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }
    const deleted = await DataSiswa.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
    }
    res.json({ success: true, message: 'Data siswa berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
