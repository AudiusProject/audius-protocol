"use strict";

var _server = _interopRequireDefault(require("react-dom/server"));

var _react = _interopRequireDefault(require("react"));

var _Head = _interopRequireDefault(require("./Head"));

var _Body = _interopRequireDefault(require("./Body"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var NotificationEmail = function NotificationEmail(props) {
  return /*#__PURE__*/_react["default"].createElement("html", null, /*#__PURE__*/_react["default"].createElement(_Head["default"], {
    title: props.title
  }), /*#__PURE__*/_react["default"].createElement(_Body["default"], props));
};

var renderNotificationsEmail = function renderNotificationsEmail(props) {
  return _server["default"].renderToString( /*#__PURE__*/_react["default"].createElement(NotificationEmail, props));
};

module.exports = renderNotificationsEmail;