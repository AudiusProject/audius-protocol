const request = require("request");
const qs = require("querystring");
const config = require("../config.js");
const models = require("../models");
const uuidv4 = require("uuid/v4");
const txRelay = require("../relay/txRelay");

const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
} = require("../apiHelpers");

/**
 * This file contains the TikTok endpoints for oauth
 */
module.exports = function (app) {
  app.post(
    "/tiktok",
    handleResponse(async (req, res, next) => {
      const csrfState = Math.random().toString(36).substring(7);
      res.cookie("csrfState", csrfState, { maxAge: 60000 });

      let url = "https://open-api.tiktok.com/platform/oauth/connect/";

      url += "?client_key={CLIENT_KEY}";
      url += "&scope=user.info.basic,video.list"
      url += "&response_type=code";
      url += "&redirect_uri={SERVER_ENDPOINT_REDIRECT}";
      url += "&state=" + csrfState;

      res.redirect(url);
    })
  );
};
