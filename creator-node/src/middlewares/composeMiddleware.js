/**
 * Combines and applies middlewares in an array
 * @param {Array} middlewares
 */
const composeMiddleware = (middlewares) => {
  if (!middlewares.length) {
    return function (_req, _res, next) { next() }
  }

  var head = middlewares[0]
  var tail = middlewares.slice(1)

  return function (req, res, next) {
    head(req, res, function (err) {
      if (err) return next(err)
      composeMiddleware(tail)(req, res, next)
    })
  }
}

module.exports = composeMiddleware
