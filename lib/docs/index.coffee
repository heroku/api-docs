fs   = require("fs")
util = require("util")
yaml = require("yamlparser")

class Docs
  constructor: (@root) ->
    this.load()

  load: ->
    @docs = {}
    fs.readdir @root, (err, files) =>
      throw(err) if err
      for idx, file of files
        name = file.split(".")[0]
        @docs[name] = yaml.eval(fs.readFileSync("#{@root}/#{file}", "utf8"))
        for idx, ep of @docs[name].endpoints
          endpoint = ep.endpoint
          endpoint.params   ||= []
          endpoint.response ||= {}
          endpoint.response.json = this.prettify_json(endpoint.response.json)
          endpoint.response.xml  = this.prettify_xml(endpoint.response.xml)
          @docs[name].endpoints[idx].endpoint = endpoint

  fetch: (name) ->
    @docs[name]

  prettify_xml: (xml) ->
    xml ||= ""
    xml = xml.replace(/\\t/g, "  ")
    xml = xml.replace(/\\-/g, "-")

  prettify_json: (json) ->
    json ||= ""
    json = json.replace(/\\t/g, "  ")
    json = json.replace(/\\-/g, "-")


exports.load = (root) ->
  new Docs(root)
