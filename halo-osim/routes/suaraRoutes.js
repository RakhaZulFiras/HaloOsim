const express = require('express');
const router = express.Router();
const suaraController = require('../controllers/suaraController');

router.post('/', suaraController.postSuara);
router.get('/', suaraController.getAllSuara);
router.get('/export', suaraController.exportCsv);
router.delete('/', suaraController.deleteAllSuara);
router.delete('/:id', suaraController.deleteSingleSuara);

module.exports = router;
