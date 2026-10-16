const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Verifikasi NISM siswa (crosscheck ke DB) & login admin (999)
router.post('/verify-nisn', authController.verifyNisn);

module.exports = router;
