"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _server = _interopRequireDefault(require("react-dom/server"));

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var WrapComponent = function WrapComponent(props) {
  var renderedChildren = _server["default"].renderToStaticMarkup(props.children);

  return /*#__PURE__*/_react["default"].createElement("div", {
    dangerouslySetInnerHTML: {
      __html: "\n    <!--[if ".concat(props["if"], "]>").concat(props.extraWrapper, "<![endif]-->\n    ").concat(renderedChildren, "\n    <!--[if ").concat(props["if"], "]>").concat(props.endExtraWrapper, "</td></tr></table></center><![endif]-->\n  ")
    }
  });
};

var _default = WrapComponent;
exports["default"] = _default;