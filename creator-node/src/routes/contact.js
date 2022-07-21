const express = require('express')

const { handleResponse, successResponse } = require('../apiHelpers')

const router = express.Router()

router.get(
  '/contact',
  handleResponse(async (req, res) => {
    const trustedNotifierManager = req.app.get('trustedNotifierManager')
    const email =
      trustedNotifierManager.getTrustedNotifierData().email ||
      'Email address unavailable at the moment'
    const response = {
      email
    }
    return successResponse(response)
  })
)

module.exports = router
