const cors = require('cors')

// Need to exclude certain routes from the default CORS config
// because they need custom CORS config (set inline, see tiktok.js)
const excludedRoutes = [
  '/tiktok/access_token'
]

const corsMiddleware = () => {
  const defaultCors = cors()

  return (req, res, next) => {
    if (excludedRoutes.includes(req.url.toLowerCase())) {
      next()
    } else {
      defaultCors(req, res, next)
    }
  }
}

module.exports = corsMiddleware
