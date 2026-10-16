const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/db-status', settingsController.checkStatus);
router.post('/config-db', settingsController.saveConfig);
router.post('/autocreate-collections', settingsController.autocreateCollections);

module.exports = router;
