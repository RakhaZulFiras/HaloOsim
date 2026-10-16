const express = require('express');
const router = express.Router();
const multer = require('multer');
const nisnController = require('../controllers/nisnController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(xlsx|xls|csv|txt)$/i.test(file.originalname)) return cb(null, true);
    cb(new Error('Format file harus .xlsx, .xls, atau .csv'));
  }
});

router.get('/', nisnController.getAllStudents);
router.post('/upload', upload.single('file'), nisnController.uploadStudentsBatch);
router.delete('/:id', nisnController.deleteStudent);

module.exports = router;
