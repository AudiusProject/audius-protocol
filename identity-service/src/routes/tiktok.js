const axios = require("axios");
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
  app.get(
    "/tiktok",
    handleResponse(async (req, res, next) => {
      const csrfState = Math.random().toString(36).substring(7);
      res.cookie("csrfState", csrfState, { maxAge: 60000 });

      let url = "https://open-api.tiktok.com/platform/oauth/connect/";
      console.log("KEY", config.get("tikTokAPIKey"));

      url += `?client_key=${config.get("tikTokAPIKey")}`;
      url += "&scope=user.info.basic,share.sound.create";
      url += "&response_type=code";
      url += "&redirect_uri=https://audius.co";
      url += "&state=" + csrfState;

      res.redirect(url);
    })
  );

  app.get(
    "/tiktok/access_token",
    handleResponse(async (req, res, next) => {
      const { code, state } = req.query;
      const { csrfState } = req.cookies;

      if (state !== csrfState) {
        res.status(422).send("Invalid state");
        return;
      }

      let urlAccessToken = "https://open-api.tiktok.com/oauth/access_token/";
      urlAccessToken += "?client_key=" + config.get("tikTokAPIKey");
      urlAccessToken += "&client_secret=" + config.get("tikTokAPISecret");
      urlAccessToken += "&code=" + code;
      urlAccessToken += "&grant_type=authorization_code";

      const resp = await axios.post(url_access_token);

      return successResponse(resp);
    })
  );
};
