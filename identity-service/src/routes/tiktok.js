const axios = require("axios");
const cors = require("cors");
const config = require("../config.js");

const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
} = require("../apiHelpers");

/**
 * This file contains the TikTok endpoints for oauth
 *
 * See: https://developers.tiktok.com/doc/login-kit-web
 */
module.exports = function (app) {
  app.get(
    "/tiktok",
    handleResponse(async (req, res, next) => {
      const csrfState = Math.random().toString(36).substring(7);
      res.cookie("csrfState", csrfState, { maxAge: 60000 });

      let url = "https://open-api.tiktok.com/platform/oauth/connect/";

      url += `?client_key=${config.get("tikTokAPIKey")}`;
      url += "&scope=user.info.basic,share.sound.create";
      url += "&response_type=code";
      url += `&redirect_uri=${config.get("tikTokAuthOrigin")}`;
      url += "&state=" + csrfState;

      res.redirect(url);
    })
  );

  const accessTokenCorsOptions = {
    credentials: true,
    origin: config.get("tikTokAuthOrigin"),
  };

  app.options("/tiktok/access_token", cors(accessTokenCorsOptions));
  app.post(
    "/tiktok/access_token",
    cors(accessTokenCorsOptions),
    handleResponse(async (req, res, next) => {
      const { code, state } = req.body;
      const { csrfState } = req.cookies;

      if (!state || !csrfState || state !== csrfState) {
        return errorResponseBadRequest("Invalid state");
      }

      let urlAccessToken = "https://open-api.tiktok.com/oauth/access_token/";
      urlAccessToken += "?client_key=" + config.get("tikTokAPIKey");
      urlAccessToken += "&client_secret=" + config.get("tikTokAPISecret");
      urlAccessToken += "&code=" + code;
      urlAccessToken += "&grant_type=authorization_code";

      const resp = await axios.post(urlAccessToken);

      return successResponse(resp);
    })
  );
};
