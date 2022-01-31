"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _BodyStyles = _interopRequireDefault(require("./BodyStyles"));

var _FontStyles = _interopRequireDefault(require("./FontStyles"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Head = function Head(props) {
  return /*#__PURE__*/_react["default"].createElement("div", null, /*#__PURE__*/_react["default"].createElement("div", {
    dangerouslySetInnerHTML: {
      __html: "\n          <!--[if gte mso 15]>\n            <xml>\n              <o:OfficeDocumentSettings>\n                <o:AllowPNG />\n                <o:PixelsPerInch>96</o:PixelsPerInch>\n              </o:OfficeDocumentSettings>\n            </xml>\n          <![endif]-->\n      "
    }
  }), /*#__PURE__*/_react["default"].createElement("meta", {
    charset: 'UTF-8'
  }), /*#__PURE__*/_react["default"].createElement("meta", {
    "http-equiv": 'x-ua-compatible',
    content: 'IE=edge'
  }), /*#__PURE__*/_react["default"].createElement("meta", {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  }), /*#__PURE__*/_react["default"].createElement("meta", {
    name: 'x-apple-disable-message-reformatting'
  }), /*#__PURE__*/_react["default"].createElement("title", null, props.title), /*#__PURE__*/_react["default"].createElement(_FontStyles["default"], null), /*#__PURE__*/_react["default"].createElement(_BodyStyles["default"], null));
};

var _default = Head;
exports["default"] = _default;