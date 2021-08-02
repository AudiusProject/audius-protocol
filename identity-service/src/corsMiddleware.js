const cors = require('cors')

// Need to exclude certain routes from the default CORS config
// because they need custom CORS config (set inline, see tiktok.js)
const excludedRoutes = [
  '/tiktok/access_token'
]

const corsMiddleware = () => {
  return (req, res, next) => {
    console.log(req.url)
    if (excludedRoutes.includes(req.url.toLowerCase())) {
        next()
    } else {
        cors()(req, res, next)
    }
  }
}

module.exports = corsMiddleware