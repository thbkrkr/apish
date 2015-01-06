'use strict';
/* globals require, console, process */

var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');

var exec = require('child_process').exec;
var walk    = require('walk');

app.use(bodyParser.json());

var port = process.env.PORT || 3333;        
var scriptsDir = process.env.SCRIPTS_DIR || './scripts';

var router = express.Router();

var Sandbox = require('sandbox');
var s = new Sandbox();

// ------------------------------------------------
// Home

router.get('/', function(req, res) {
    res.json({
        'tagline': 'Rest API for your shell scripts',
        'name': 'apishh',
        'status': 200,
        'ok': true,
        '_links': {
            'scripts': 'http://' + req.headers.host + '/!'
            }
    });
});

// ------------------------------------------------
// Scripts list

router.get('/!', function(req, res) {
    var files   = '[';
    var comma = '';
    var walker  = walk.walk(scriptsDir, { followLinks: false });

    walker.on('file', function(root, stat, next) {
        root = 'http://' + req.headers.host + '/!' + root.replace(scriptsDir, '');
        files += comma + '"' + root + '/' + stat.name + '"';
        comma = ',';
        next();
    });

    walker.on('end', function() {
        files   += ']';
        res.json(JSON.parse(files));
    });
});

// ------------------------------------------------
// Script execution

var regexp = /^[A-Za-z0-9\-]*$/;

router.get('/!/:dir/:script', function(req, res) {

    var dir = req.params.dir;
    var script = req.params.script;
    var param = '';

    var p = req.query.p;
    if (p) {
        if (regexp.test(p)) {
            param = ' ' + p;
        } else {
            res.statusCode = 400;
            res.json({status:'ko', message: 'Bad parameter: ' + p});
        }
    }

    var cmd = scriptsDir + '/' + dir + '/' + script + param;
    console.log('exec(' + cmd + ')');

    exec(cmd, function(error, stdout, stderr) {
        if (error !== null) {
            res.statusCode = 500;
            if (stderr) {
                stderr = ' (' + stderr + ')';
            }
            res.json({status:'ko', message: 'Script failed with status ' + error.code + stderr});
        }

        try {
            var json = JSON.parse(stdout);
            console.log('success', json);
            res.json(json);
        } catch(err) {
            res.statusCode = 500;
            res.json({message:'JSON parsing failed: ' + err.message + ' (' + stdout + ')'});
        }
    });
});

router.post('/!/js', function(req, res) {
    var code = '(function(data) {' + req.body.script + '})('+JSON.stringify(req.body.data)+')';
    s.run(code , function(output) {
        if (output.result === 'TimeoutError') {
            res.statusCode = 500;
        } else if (output.result.indexOf('SyntaxError:') !== -1) {
            res.statusCode = 500;
        } else if (output.result === 'null') {
            res.statusCode = 500;
        }
        res.json(output.result);
    });
});

app.use('/', router);
app.listen(port);
console.log('Magic happens on port ' + port);
