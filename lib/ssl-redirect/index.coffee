module.exports = (req, res, next) ->
  if process.env.NODE_ENV == "production" && req.headers["x-forwarded-proto"] != "https"
    res.redirect "https://" + req.headers["host"] + req.url
  else
    next()
