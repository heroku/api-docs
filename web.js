var express = require('express');
var fs      = require('fs');
var rest    = require('restler');
var qs      = require('querystring');
var sass    = require('sass');
var sys     = require('sys');
var yaml    = require('yamlparser');

var app = express.createServer(
  express.logger(),
  express.cookieParser(),
  express.session({ secret: process.env.SECRET }),
  require('connect-form')({ keepExtensions: true })
);

app.get('/kikai.css', function(req, res) {
  res.contentType('text/css');
  res.send(sass.render(fs.readFileSync('views/kikai.sass', 'utf8')));
});

app.get('/kikai.js', function(req, res) {
  res.contentType('text/javascript');
  res.send(fs.readFileSync('views/kikai.js', 'utf8'));
});

app.get('/', function(req, res) {
  res.redirect('/apps');
});

app.get('/:section', function(req, res) {
  var api = yaml.eval(fs.readFileSync('api/' + req.params.section + '.yml', 'utf8'));

  for (var i=0; i<api.endpoints.length; i++) {
    api.endpoints[i].endpoint.params = api.endpoints[i].endpoint.params || [];
    api.endpoints[i].endpoint.response = api.endpoints[i].endpoint.response || {};
    api.endpoints[i].endpoint.response.json = prettify_json(api.endpoints[i].endpoint.response.json);
    api.endpoints[i].endpoint.response.xml  = prettify_xml(api.endpoints[i].endpoint.response.xml);
  }

  res.render('section.jade', { api: api });
});

app.post('/request', function(req, res, next) {
  if (!req.form) { next('invalid form'); }
  else {
    req.form.complete(function(err, fields, files) {
      if (err) { next(err); }
      else {
        var action_parts = fields.action.split(' ');
        var method = action_parts[0];
        var path = action_parts[1];

        var auth = new Buffer(':' + fields.apikey).toString('base64');

        var options = {
          method: method,
          headers: { 'Accept': 'application/xml', 'Authorization': auth },
        }

        console.log(qs.parse(fields.params));

        switch(method) {
          case 'GET':
            options.query = fields.params;
            break;
          case 'POST':
            options.data = qs.parse(fields.params);
            break;
        }

        console.log(options);

        var request = rest.request('https://api.heroku.com' + path, options);

        request.on('success', function(data) {
          res.send(data);
        });

        request.on('error', function(data) {
          console.log('error:' + data);
          res.send(data);
        });
      }
    });
  }
});

function prettify_xml(xml) {
  if (xml) {
    xml = xml.replace(/\\t/ig, '  ');
    console.log(xml);
  }
  return(xml);
}

function prettify_json(json) {
  return(json);
}

var port = process.env.PORT || 3000;
console.log('listening on port: %s', port);
app.listen(port);
