"use strict";

var _server = _interopRequireDefault(require("react-dom/server"));

var _react = _interopRequireDefault(require("react"));

var _Head = _interopRequireDefault(require("./Head"));

var _Body = _interopRequireDefault(require("./Body"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var NotificationEmail = function NotificationEmail(props) {
  return _react["default"].createElement("html", null, _react["default"].createElement(_Head["default"], {
    title: props.title
  }), _react["default"].createElement(_Body["default"], props));
};

var renderNotificationsEmail = function renderNotificationsEmail(props) {
  return _server["default"].renderToString(_react["default"].createElement(NotificationEmail, props));
};

module.exports = renderNotificationsEmail;
var notifs = {
  notifications: [{
    type: 'Milestone',
    achievement: 'Listen',
    entity: {
      type: 'Track',
      name: 'Scared Butterfly'
    },
    value: 10
  }, {
    type: 'Follow',
    users: [{
      name: 'roneil',
      image: 'https://download.audius.co/static-resources/email/user.png'
    }],
    entity: {
      type: 'Playlist',
      name: 'forrest-playlist'
    }
  }, {
    type: 'Repost',
    users: [{
      name: 'roneil',
      image: 'https://download.audius.co/static-resources/email/user.png'
    }],
    entity: {
      type: 'Track',
      name: 'fly_theremin_1'
    }
  }, {
    type: 'Repost',
    users: [{
      name: 'roneil',
      image: 'https://download.audius.co/static-resources/email/user.png'
    }],
    entity: {
      type: 'Track',
      name: 'space_rubberband_2'
    }
  }, {
    type: 'Repost',
    users: [{
      name: 'roneil',
      image: 'https://download.audius.co/static-resources/email/user.png'
    }],
    entity: {
      type: 'Track',
      name: 'space_rubberband_1'
    }
  }],
  title: 'Daily Email - hareesh12@audius.co',
  subject: 'Unread notifications from yesterday'
};
console.log(renderNotificationsEmail(notifs));