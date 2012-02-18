rest = require("restler")

class HerokuNavHeader

  constructor: (@host) ->
    request = rest.get "#{@host}/header.json",
      headers:
        Accept: "application/json"
      parser: (res, cb) ->
        cb(JSON.parse(res[1..-2]))
    request.on "success", (data, response) =>
      @header = data.html
    request.on "error", (data, response) ->
      throw(data)

  middleware: (req, res, next) =>
    write = res.write
    end   = res.end

    res.write = (chunk, encoding) =>
      chunk = chunk.replace /(<head>)/i,   "$1<link href='#{@host}/header.css' media='all' rel='stylesheet' type='text/css' />"
      chunk = chunk.replace /(<body.*?>\s*(<div .*?class=["'].*?container.*?["'].*?>)?)/i, "$1#{@header}"
      res.setHeader("Content-Length", chunk.length.toString())
      write.call(res, chunk, encoding)

    res.end = (chunk, encoding) ->
      this.write(chunk, encoding)
      end.call(res)

    next()

module.exports = (host) ->
  new HerokuNavHeader(host).middleware
