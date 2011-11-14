var express = require('express');
var fs      = require('fs');
var rest    = require('restler');
var qs      = require('querystring');
var sass    = require('sass');
var sys     = require('sys');
var yaml    = require('yamlparser');

var api_docs = {};

read_api_docs();

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
  res.render('getting-started.jade', { current_section: '' });
});

app.get('/:section', function(req, res, next) {
  if (process.env.NODE_ENV != 'production')
    read_api_docs();

  if (!api_docs[req.params.section]) { next('no such section') }
  else {
    var api = api_docs[req.params.section];

    for (var i=0; i<api.endpoints.length; i++) {
      api.endpoints[i].endpoint.params = api.endpoints[i].endpoint.params || [];
      api.endpoints[i].endpoint.response = api.endpoints[i].endpoint.response || {};
      api.endpoints[i].endpoint.response.json = prettify_json(api.endpoints[i].endpoint.response.json);
      api.endpoints[i].endpoint.response.xml  = prettify_xml(api.endpoints[i].endpoint.response.xml);
    }

    var current_section = req.url.substring(1);

    res.render('section.jade', { api: api, current_section: current_section });
  }
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

        switch(method) {
          case 'GET':
            options.query = fields.params;
            break;
          case 'POST':
            if (fields.params.indexOf('=') > -1) {
              options.data = qs.parse(fields.params);
            } else {
              var data = full_uri_decode(fields.params);
              options.data = data;
              options.headers['Content-Length'] = data.length.toString();
            }
            break;
          case 'PUT':
            if (fields.params.indexOf('=') > -1) {
              options.data = qs.parse(fields.params);
            } else {
              var data = full_uri_decode(fields.params);
              options.data = data;
              options.headers['Content-Length'] = data.length.toString();
            }
            break;
          case 'DELETE':
            options.headers['Content-Length'] = '0';
            break;
        }

        var request = rest.request(process.env.API_HOST + path, options);

        request.on('success', function(data, response) {
          switch(response.headers['content-type'].split(';')[0]) {
            case 'application/json':
              try {
                data = JSON.stringify(JSON.parse(data), null, '  ');
              } catch(error) {
                console.log('error parsing json: ' + error);
              }
              break;
          }
          res.send('HTTP/1.1 200 OK\n' + data, 200);
        });

        request.on('error', function(data, response) {
          res.send('HTTP/1.1 ' + response.headers.status + '\n' + data, response.statusCode);
        });
      }
    });
  }
});

function prettify_xml(xml) {
  if (xml) {
    xml = xml.replace(/\\t/ig, '  ');
    xml = xml.replace(/\\-/ig, '-');
  }
  return(xml);
}

function prettify_json(json) {
  if (json) {
    json = json.replace(/\\t/ig, '  ');
    json = json.replace(/\\-/ig, '-');
  }
  return(json);
}

function read_api_docs() {
  fs.readdir(__dirname + '/api', function(err, files) {
    files.forEach(function(file) {
      var sp = file.split('.');
      if (sp[1] == 'yml') {
        api_docs[sp[0]] = yaml.eval(fs.readFileSync('api/' + file, 'utf8'));
      }
    });
  });
}

function full_uri_decode(string) {
  string = decodeURIComponent(string);
  string = string.replace(/\%2E/g, '.');
  return(string);
}

function anchor(endpoint) {
  var name = endpoint.action;
  name = name.replace(/ +/g, '');
  name = name.replace(/\//g, '_');
  name = name.replace(/:/g, '');
  return(name);
};

app.helpers({
  anchor: anchor,
  api_docs: function(name) {
    return(api_docs[name]);
  },
  section_li: function(path, name, current_section) {
    var active_class = (current_section == path) ? 'active' : '';
    var html = '<li class="' + active_class + '"><a href="/' + path + '">' + name + '</a></li>';

    if (current_section == path && api_docs[path]) {
      api_docs[path].endpoints.forEach(function(endpoint) {
        var text = endpoint.endpoint.text.split('\n')[0];
        html += '<li class="item"><a href="#' + anchor(endpoint.endpoint) + '">' + text + '</a></li>';
      });
    }

    return(html);
  },
  text_as_html: function(text) {
    text = text.replace(/\n/g, '<br>');
    text = text.replace(/\+([^+]+)\+/g, '<b>$1</b>');
    return(text);
  }
});

var port = process.env.PORT || 3000;
console.log('listening on port: %s', port);
app.listen(port);
