module.exports = (req, res, next) ->
  if req.headers["x-forwarded-proto"] != "https"
    res.redirect "https://" + req.headers["host"] + req.url
  else
    next()
