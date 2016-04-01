// fmon version 2 - (Mains Frequency Monitoring API)
var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var path = require('path');

// Fall back, display some info
router.get('/', function (req, res) {
    res.status(200);
    res.json({
        "description": "Nee, ga weg"
    });
});


module.exports = router;
