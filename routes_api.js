// fmon version 2 - (Mains Frequency Monitoring API)
var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var jwt = require('jwt-simple');
var sqlite3 = require('sqlite3').verbose();
var path = require('path');

var dbfile = "miniproject.db";
var db = new sqlite3.Database(dbfile);

var sys= require('sys');
var exec= require('child_process').exec;

function puts(error, stdout, stderr) { console.log("SYSEXEC: " + stdout) };

router.all( new RegExp("[^(\/login|\/register)]"), function (req, res, next) {

	console.log("Authenticating...");

    var token = (req.header('X-Access-Token')) || '';
    if (token) {
        try {
            var decoded = jwt.decode(token, req.app.get('secretkey'));

            var query = "SELECT COUNT(username) AS num FROM user WHERE access='" + token + "' AND username='" + decoded.iss + "';";
		    db.get(query, function (err, row) {
		        if(err) throw err;

		        console.log("Found " + row.num + " valid users");

			    if (row.num == 1) {
			        req.app.set("userid", decoded.iss);
	                console.log("Userid: " + req.app.get('userid'));
	                return next();
	            }
	            else {
	                res.status(401);
	                res.json({
	                    "status": 401, "message": "unknown userid, bye"
	                });
	                return;
	            }

			});
	    }
        catch (err) {
            console.log("Authorization failed: " + err);
            res.status(401);
		    res.json({
		        "status": 401, "message": "unknown userid, bye"
		    });
        }
    }
    else
    {
    	console.log("Authorization failed: Token not set");
        res.status(401);
	    res.json({
	        "status": 401, "message": "token not set"
	    });
    }
});

// Restfull register
router.post('/register', function (req, res) {

    var username = req.body.username || '';
    var password = req.body.password || '';

        // Check for empy body
    if (username == '' || password == '') {
        res.status(401);
        res.json({
            "status": 401,
            "message": "Body is empty"
        });
        return;
    }

   	var query = "SELECT COUNT(*) AS num FROM user WHERE username='" + username + "';";
   	db.get(query, function(err, row){
   		if(err) throw err;

   		if(row.num >= 1)
   		{
   			var results = [];
		    res.status(400);
		    results.push({
		      success:false,
		      msg: "Username already exists"
		    });
		    res.json(results);
		    return;
		}
		else
		{
			// db lookup
		    var query = "INSERT INTO user VALUES('" + username + "', '" + password + "', 'null');";
		    db.run(query);

		    var results = [];
		    res.status(200);
		    results.push({
		      success:true,
		      username: username,
		      password: password
		    });

		    res.json(results);
		}
   	});

    
});

// Restfull login
router.post('/login', function (req, res) {

    var username = req.body.username || '';
    var password = req.body.password || '';

    // Check for empy body
    if (username == '' || password == '') {
        res.status(401);
        res.json({
            "status": 401,
            "message": "Body is empty"
        });
        return;
    }

    var query = "SELECT COUNT(*) AS num FROM user WHERE username='" + username + "' AND password='" + password + "';";
    db.get(query, function (err, row) {
        if(err) throw err;

         // Check for valid user/passwd combo
	    if (row.num == 1) {
	        var now = new Date();
	        var expires = now.setHours(now.getDay() + 10);
	        var token = jwt.encode({
	            iss: username,
	            exp: expires
	        }, req.app.get('secretkey'));

	        var query = "UPDATE user SET access='" + token + "' WHERE username='" + username + "';";
	        db.run(query);

	        res.status(200);
	        res.json({
	        	status: true,
	            token: token,
	            expires: expires,
	            user: username
	        });
	    }
	    else {
	        res.status(401);
	        res.json({
	            "status": 401,
	            "status": false,
	            "message": "Invalid username or password"
	        });
	    }

	});
});

// Restfull logout
router.post('/logout', function (req, res) {

	var token = (req.header('X-Access-Token')) || '';

    var query = "UPDATE user SET access='' WHERE access='" + token + "';";

    db.run(query);

	var results = [];
    res.status(200);
    results.push({
      success:true,
      msg: "Logged out"
    });

    res.json(results);
});

//Turn on or of a light
router.get('/light/:group/:num/:state', function (req, res) {
    var group = req.params.group;
    var num = req.params.num;
    var state = req.params.state;

    var results = [];
    res.status(200);
    results.push({
      success:true,
      group: group,
      number:num,
      state:state
    });

    exec('sudo ./kaku ' + group + ' ' + num + ' ' + state, puts);
    res.json(results);
});

//Turn on or off a light in the database
router.get('/light/:name/:state', function (req, res) {
    var name = req.params.name;
    var state = req.params.state;

    var group;
    var num;

    var query = "SELECT class, channel FROM light WHERE name='" + name + "';";
    db.get(query, function (err, row) {
        if(err) throw err;

        group = row.class;
        num = row.channel;

        var results = [];
	    res.status(200);
	    results.push({
	      success:true,
	      name: name,
	      group: group,
	      num: num,
	      state: state
	    });

	    exec('sudo ./kaku ' + group + ' ' + num + ' ' + state, puts);
	    res.json(results);

	});
});

//Add a new light to the database
router.post('/light', function (req, res) {
	var name = req.body.name || '';
    var group = req.body.group || '';
    var channel = req.body.channel || '';

    // Check for empy body
    if (name == '' || group == '' || channel == '') {
        res.status(401);
        res.json({
            "status": 401,
            "message": "Body is empty"
        });
        return;
    }

    var query = "SELECT COUNT(*) AS num FROM light WHERE name='" + name + "';";
   	db.get(query, function(err, row){
   		if(err) throw err;

   		if(row.num >= 1)
   		{
   			var results = [];
		    res.status(400);
		    results.push({
		      success:false,
		      msg: "Name already in use"
		    });
		    res.json(results);
		    return;
		}
		else
		{
			// db lookup
		    var query = "INSERT INTO light VALUES('" + name + "', '" + group + "', '" + channel + "');";
		    db.run(query);

		    var results = [];
		    res.status(200);
		    results.push({
		      success:true,
		      group: group,
		      channel: channel
		    });

		    res.json(results);
		}
   	});
});


//Update a light in the database
router.put('/light', function (req, res) {
	var name = req.body.name || '';
    var group = req.body.group || '';
    var channel = req.body.channel || '';

    // Check for empy body
    if (name == '' || group == '' || channel == '') {
        res.status(401);
        res.json({
            "status": 401,
            "message": "Body is empty"
        });
        return;
    }

	// db lookup
    var query = "UPDATE light SET class='" + group + "', channel='" + channel + "' WHERE name='" + name + "';";
    db.run(query);

    var results = [];
    res.status(200);
    results.push({
      success:true,
      name: name,
      group: group,
      channel: channel
    });

    res.json(results);
});

//Get all the users in the database (Testing purposes only)
router.get('/user', function (req, res) {

	var token = (req.header('X-Access-Token')) || '';

    // db lookup
    var query = "SELECT username FROM user WHERE access='" + token + "';";
    db.get(query, function (err, rows) {
        if(err) throw err;
            var results = [];
            results.push({
                username: item.username
            });
            res.json(results);
        });
    res.status(200);
});

//Get all the users in the database (Testing purposes only)
router.get('/users', function (req, res) {

    // db lookup
    var query = "SELECT username, password, access FROM user WHERE 1;";
    db.all(query, function (err, rows) {
        if(err) throw err;
            var results = [];
            var users = [];
            rows.forEach(function(item){
                users.push({
                    username: item.username,
                    password: item.password,
                    access: item.access
                });
            });
            results.push({users: users});
            res.json(results);
        });
    res.status(200);
});

//Get all the lights in te database
router.get('/lights', function (req, res) {

    // db lookup
    var query = "SELECT name, class, channel FROM light WHERE 1;";
    db.all(query, function (err, rows) {
        if(err) throw err;
            var results = [];
            var lights = [];
            rows.forEach(function(item){
                lights.push({
                    name: item.name,
                    group: item.class,
                    channel: item.channel
                });
            });
            results.push({lights: lights});
            res.json(results);
        });
    res.status(200);
});

//Fall back, display an error
router.get('/light*', function (req, res) {
    var results = [];
    res.status(400);
    results.push({
      success:false,
      message:'Params required'
    });
    res.json(results);
});

// Fall back, display some info
router.get('/', function (req, res) {
    res.status(200);
    res.json({
        "description": "Project X API version 2. Welcome"
    });
});


module.exports = router;
