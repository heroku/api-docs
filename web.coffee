express = require("express")
fs      = require("fs")
heroku  = require("heroku")
sass    = require("sass")
util    = require("util")

docs = require('docs').load("#{__dirname}/api")

app = express.createServer(
  express.logger(),
  express.cookieParser(),
  express.session(secret: process.env.SECRET),
  express.static(__dirname + "/public"),
  require("ssl-redirect")
)

app.get "/kikai.css", (req, res) ->
  res.contentType "text/css"
  res.send sass.render(fs.readFileSync("views/kikai.sass", "utf8"))

app.get "/", (req, res) ->
  res.render "getting-started.jade", current_section: ""

app.get "/:section", (req, res, next) ->
  throw "no such section" unless doc = docs.fetch(req.params.section)
  res.render "section.jade", doc: doc, current_section: req.url.substring(1)

app.post "/request", (req, res, next) ->
  throw "invalid form" unless req.form

  req.form.complete (err, fields, files) ->
    throw err if err

    [method, path] = fields.action.split(" ")
    api = heroku.api(fields.apikey, fields.accept).request(method, path, fields.params)

    api.on "success", (data, response) ->
      res.send data, 200

    api.on "error", (data, response) ->
      res.send data, response.statusCode


app.helpers
  anchor: (endpoint) ->
    name = endpoint.action
    name = name.replace(RegExp(" +", "g"), "")
    name = name.replace(/\/:\w*/g, "")
    name = name.replace(/\/+/g, "/")
    name

  api_docs: (name) ->
    api_docs[name]

  section_li: (path, name, current_section) ->
    active = if current_section == path then "active" else ""
    html = "<li class=\"" + active + "\"><a href=\"/" + path + "\">" + name + "</a></li>"
    html += this.subsection_li(docs.fetch(path)) if current_section == path
    html

  subsection_li: (doc) ->
    return "" unless doc
    items = for idx, endpoint of doc.endpoints
      text = endpoint.endpoint.text.split("\n")[0]
      "<li class=\"item\"><a href=\"#" + this.anchor(endpoint.endpoint) + "\">" + text + "</a></li>"
    items.join("\n")

  text_as_html: (text) ->
    text = text.replace(/\n/g, "<br>")
    text = text.replace(/\+([^+]+)\+/g, "<b>$1</b>")
    text

# listen on $PORT
port = process.env.PORT or 3000
console.log "listening on port: %s", port
app.listen port
