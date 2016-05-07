// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var vision = require('node-cloud-vision-api');
var google = require('googleapis');
var fs = require('fs');
var _ = require('lodash');


var app = express();

var key = require('./config/google-service-account-key.json');


var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/cloud-platform'], null);


jwtClient.authorize(function(err, tokens) {
	if (err) {
		console.log(err);
		return;
	}

  	// Make an authorized request to list Drive files.
	vision.init({
		auth: jwtClient
	});
	console.log('vision inited');
});



var page = fs.readFileSync(__dirname + '/views/index.html', { encoding: 'utf8'}),
	pageTemplate = _.template(page);

// google.auth.getApplicationDefault(function(err, authClient) {
// 	console.log('got a response', authClient);


//   if (err) {
//     console.log('Failed to get the default credentials: ' + String(err));
//     return;
//   }
//   // The createScopedRequired method returns true when running on GAE or a local developer
//   // machine. In that case, the desired scopes must be passed in manually. When the code is
//   // running in GCE or a Managed VM, the scopes are pulled from the GCE metadata server.
//   // See https://cloud.google.com/compute/docs/authentication for more information.
//   if (authClient.createScopedRequired && authClient.createScopedRequired()) {
//     // Scopes can be specified either as an array or as a single, space-delimited string.
//     // authClient = authClient.createScoped(['https://www.googleapis.com/auth/compute']);
//     console.log('need scopes');
//   }
  

//   vision.init({
//   	auth: authClient
//   });
//   console.log('vision inited');
// });


app.use(express.static(__dirname + '/assets'));


/**
	 * 
	 * http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file?lq=1
	 * http://stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
	 */
	function decodeBase64Image (dataURL, callback) {
		var	matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

		var data = matches[2];
		
		var fileType = matches[1].split('/')[1];

		var filename = Date.now() + Math.random().toFixed(5).split('.')[1] + '.' + fileType,
			filePath = __dirname + '/tmp/' + filename;

		fs.writeFile(filePath, data, 'base64', function(err){
			// console.log('decodeBase64Image writeFile callback', err);
			return callback(err, filePath);
		});
	}

app.get('/', function(req, res) {
  var page = fs.readFileSync(__dirname + '/views/index.html', { encoding: 'utf8'});
  return res.send(page);
});

app.get('/v2', function(req, res) {
  var page = fs.readFileSync(__dirname + '/views/index.without-parallax.html', { encoding: 'utf8'});
  return res.send(page);
});


app.get('/test', function(req, res) {
			
	// construct parameters
	const visionReq = new vision.Request({
	  image: new vision.Image(__dirname + '/samples/verizon-poster.jpg'),
	  features: [
	    new vision.Feature('TEXT_DETECTION'),
	    new vision.Feature('LOGO_DETECTION', 2)
	  ]
	});

	// send single request
	vision.annotate(visionReq).then((response) => {
	  // handling response
	  console.log('response', response);
	  res.send(JSON.stringify(response.responses))
	}, (e) => {
	  res.send('Error: ' + String(e));
	});
});


app.post('/scan-photo', bodyParser.json({limit: '20mb'}), function(req, res){
	// console.log('post req.body', req.body)
	var	matches = req.body.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

	var data = matches[2];

	// construct parameters
	const visionReq = new vision.Request({
	  image: new vision.Image({
	  	base64: data
	  }),
	  features: [
	    new vision.Feature('TEXT_DETECTION'),
	    new vision.Feature('LOGO_DETECTION', 2)
	  ]
	});

	// send single request
	vision.annotate(visionReq).then((response) => {
	  // handling response
	  console.log('response', response);
	  res.json(response.responses);
	}, (e) => {
		console.log('Google Vision API error');
		console.dir(e);	
	  res.status(500).json({
	  	'error' : e
	  });
	});
});


if (module === require.main) {
  // [START server]
  // Start the server
  var server = app.listen(process.env.PORT || 8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
  });
  // [END server]
}

module.exports = app;
