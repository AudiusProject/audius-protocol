"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var iconStyle = {
  height: '24px',
  width: '24px',
  padding: '0px 24px'
};

var InstagramLink = function InstagramLink() {
  return _react["default"].createElement("a", {
    href: "https://www.instagram.com/audiusmusic/"
  }, _react["default"].createElement("img", {
    src: "https://download.audius.co/static-resources/email/iconInsta.png",
    alt: "instagram",
    style: iconStyle
  }));
};

var TwitterLink = function TwitterLink() {
  return _react["default"].createElement("a", {
    href: "https://twitter.com/AudiusProject"
  }, _react["default"].createElement("img", {
    src: "https://download.audius.co/static-resources/email/iconTwitter.png",
    alt: "twitter",
    style: iconStyle
  }));
};

var DiscordLink = function DiscordLink() {
  return _react["default"].createElement("a", {
    href: "https://discordapp.com/invite/yNUg2e2"
  }, _react["default"].createElement("img", {
    src: "https://download.audius.co/static-resources/email/iconDiscord.png",
    alt: "discord",
    style: iconStyle
  }));
};

var MadeWithLove = function MadeWithLove() {
  return _react["default"].createElement("div", {
    className: 'gilroy',
    style: {
      textAlign: 'center',
      color: '#858199',
      fontSize: '14px'
    }
  }, "Made with ", _react["default"].createElement("span", {
    style: {
      color: '#7E1BCC'
    }
  }, "\u2665\uFE0E"), " in SF & LA");
};

var AllRightsReserved = function AllRightsReserved() {
  var currentYear = new Date().getFullYear().toString();
  return _react["default"].createElement("div", {
    className: 'gilroy',
    style: {
      textAlign: 'center',
      color: '#858199',
      fontSize: '14px'
    }
  }, `\xA9 ${currentYear} Audius, Inc. All Rights Reserved.`);
};

var Unsubscribe = function Unsubscribe() {
  return _react["default"].createElement("div", {
    className: 'gilroy',
    style: {
      textAlign: 'center',
      color: '#858199',
      fontSize: '14px'
    }
  }, 'Tired of seeing these emails? ', _react["default"].createElement("a", {
    href: "https://audius.co/settings",
    "class": "utilityLink",
    style: {
      textDecorationColor: '#858199'
    }
  }, _react["default"].createElement("span", {
    style: {
      color: '#858199'
    }
  }, 'Update your notification preferences')), _react["default"].createElement("span", {
    "class": "mobileHide"
  }));
};

var Footer = function Footer(props) {
  return _react["default"].createElement("table", {
    border: "0",
    cellpadding: "0",
    cellspacing: "0",
    style: {
      margin: '0px auto',
      height: 'auto',
      paddingBotton: '25px'
    }
  }, _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    valign: "center",
    id: "socialBar",
    style: {
      textAlign: 'center',
      padding: '25px 0px 20px'
    }
  }, _react["default"].createElement(InstagramLink, null), _react["default"].createElement(TwitterLink, null), _react["default"].createElement(DiscordLink, null))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    valign: "center",
    style: {
      textAlign: 'center',
      padding: '0px 0px 8px',
      margin: '0px'
    }
  }, _react["default"].createElement(MadeWithLove, null))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    style: {
      textAlign: 'center',
      verticalAlign: 'center',
      height: 'auto',
      padding: '0px 0px 12px',
      margin: '0px'
    }
  }, _react["default"].createElement(AllRightsReserved, null))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    valign: "top",
    id: "utilityBar"
  }, _react["default"].createElement(Unsubscribe, null))));
};

var _default = Footer;
exports["default"] = _default;
