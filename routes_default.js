// fmon version 2 - (Mains Frequency Monitoring API)
var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var path = require('path');

// Fall back, display some info
router.get('/gaben', function (req, res) {
    res.status(200);
    res.type('.html');
    res.send('<body background="http://www.imgbase.info/images/safe-wallpapers/video_games/1_other_video_games/44028_1_other_video_games_gaben.jpg"></body>');
});


// Fall back, display some info
router.get('/onvoldoende', function (req, res) {
    res.status(200);
    res.type('.html');
    res.send('<iframe width="560" height="315" src="https://www.youtube.com/embed/O67ni2Y2YEc" frameborder="0" allowfullscreen></iframe>');
});

// Fall back, display some info
router.get('/kok', function (req, res) {
    res.status(200);
    res.type('.html');
    res.send('<iframe width="420" height="315" src="https://www.youtube.com/embed/uBHBA2DjCpA" frameborder="0" allowfullscreen></iframe>');
});

// Fall back, display some info
router.get('/', function (req, res) {
    res.status(200);
    res.type('.html');
    res.send('<img src="http://puu.sh/o1Trk.png">');
});


module.exports = router;
