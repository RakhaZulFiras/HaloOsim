const DataSiswa = require('../models/DataSiswa');

exports.verifyNisn = async (req, res) => {
  // Terima 'nism' (baru) maupun 'nisn' (lama); paksa jadi string (cegah NoSQL injection)
  const nism = String(req.body.nism ?? req.body.nisn ?? '').trim();

  if (!nism) {
    return res.status(400).json({ success: false, message: 'Silakan masukkan NISM' });
  }

  // Akses portal Admin
  if (nism === '999') {
    return res.json({ success: true, isAdmin: true });
  }

  try {
    const student = await DataSiswa.findOne({ nism }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'NISM tidak terdaftar di database.' });
    }
    res.json({
      success: true,
      isAdmin: false,
      student: { nism: student.nism, nama: student.nama }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
