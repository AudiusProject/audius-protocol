'use strict'

const _server = _interopRequireDefault(require('react-dom/server'))

const _react = _interopRequireDefault(require('react'))

const _Head = _interopRequireDefault(require('./Head'))

const _Body = _interopRequireDefault(require('./Body'))

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

const NotificationEmail = function NotificationEmail(props) {
  return /* #__PURE__ */ _react.default.createElement(
    'html',
    null,
    /* #__PURE__ */ _react.default.createElement(_Head.default, {
      title: props.title
    }),
    /* #__PURE__ */ _react.default.createElement(_Body.default, props)
  )
}

const renderNotificationsEmail = function renderNotificationsEmail(props) {
  return _server.default.renderToString(
    /* #__PURE__ */ _react.default.createElement(NotificationEmail, props)
  )
}

module.exports = renderNotificationsEmail
