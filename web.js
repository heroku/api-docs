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
  express.static(__dirname + '/public'),
  require('connect-form')({ keepExtensions: true })
);

if (process.env.NODE_ENV == 'production') {
  app.get('*', function(req, res, next) {
    if (req.headers['x-forwarded-proto'] != 'https') {
      console.log('https://' + req.headers['host'] + req.url);
      res.redirect('https://' + req.headers['host'] + req.url);
    } else {
      next()
    }
  })
}

app.get('/kikai.css', function(req, res) {
  res.contentType('text/css');
  res.send(sass.render(fs.readFileSync('views/kikai.sass', 'utf8')));
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
          headers: { 'Accept': fields.accept, 'Authorization': auth },
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
          res.send(data, 200);
        });

        request.on('error', function(data, response) {
          res.send(data, response.statusCode);
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
  if (json) {
    json = json.replace(/\\t/ig, '  ');
    console.log(json);
  }
  return(json);
}

var port = process.env.PORT || 3000;
console.log('listening on port: %s', port);
app.listen(port);
