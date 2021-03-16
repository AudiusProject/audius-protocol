async function userNodeMiddleware (req, res, next) {
  // Disable all UM specific filtering
  return next()
}

module.exports = { userNodeMiddleware }
