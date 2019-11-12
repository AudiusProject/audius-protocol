"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _Footer = _interopRequireDefault(require("./Footer"));

var _Notification = _interopRequireDefault(require("./notifications/Notification"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var AudiusImage = function AudiusImage() {
  return _react["default"].createElement("img", {
    src: "https://gallery.mailchimp.com/f351897a27ff0a641b8acd9ab/images/b1070e55-9487-4acb-abce-e755484cce46.png",
    style: {
      maxWidth: '240px',
      margin: '27px auto'
    },
    alt: "Audius Logo"
  });
};

var WhatYouMissed = function WhatYouMissed() {
  return _react["default"].createElement("img", {
    src: "https://download.audius.co/static-resources/email/whatYouMissed.png",
    style: {
      maxWidth: '490px',
      margin: '0px auto 7px'
    },
    alt: "What You Missed"
  });
};

var UnreadNotifications = function UnreadNotifications(_ref) {
  var message = _ref.message;
  return _react["default"].createElement("p", {
    className: 'avenir',
    style: {
      color: 'rgba(133,129,153,0.5)',
      fontSize: '16px',
      fontWeight: 500,
      letterSpacing: '0.02px',
      textAlign: 'center',
      margin: '0px auto 24px'
    }
  }, message);
};

var Body = function Body(props) {
  return _react["default"].createElement("body", {
    bgcolor: "#FFFFFF"
  }, _react["default"].createElement("center", null, _react["default"].createElement("table", {
    align: "center",
    border: "0",
    cellpadding: "0",
    cellspacing: "0",
    width: "100%",
    id: "bodyTable",
    bgcolor: "#FFFFFF",
    style: {
      height: '100%'
    }
  }, _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell"
  }, _react["default"].createElement(AudiusImage, null))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell"
  }, _react["default"].createElement(WhatYouMissed, null))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell"
  }, _react["default"].createElement(UnreadNotifications, {
    message: props.unreadMessage
  }))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell",
    style: {
      borderRadius: '4px',
      maxWidth: '396px',
      marginBottom: '32px'
    }
  }, props.notifications.map(function (notification, ind) {
    return _react["default"].createElement(_Notification["default"], _extends({
      key: ind
    }, notification));
  }))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell",
    style: {
      padding: '24px 0px 32px',
      width: '100%'
    }
  }, _react["default"].createElement("table", {
    cellspacing: "0",
    cellpadding: "0",
    style: {
      margin: '0px auto'
    }
  }, _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    style: {
      borderRadius: '17px',
      margin: '0px auto'
    },
    bgcolor: "#7E1BCC"
  }, _react["default"].createElement("a", {
    href: "https://audius.co",
    target: "_blank",
    style: {
      padding: '8px 24px',
      fontSize: '14px',
      color: '#ffffff',
      textDecoration: 'none',
      fontWeight: 'bold',
      display: 'inline-block'
    }
  }, "See more on Audius")))))), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    style: {
      paddingBottom: '25px'
    }
  }, _react["default"].createElement(_Footer["default"], null))))));
};

var _default = Body;
exports["default"] = _default;