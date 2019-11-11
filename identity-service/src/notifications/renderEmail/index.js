"use strict";

var _server = _interopRequireDefault(require("react-dom/server"));

var _react = _interopRequireDefault(require("react"));

var _Head = _interopRequireDefault(require("./Head"));

var _Body = _interopRequireDefault(require("./Body"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
props = {
  title: 'What You Missed',
  unreadMessage: 'Unread Notifications from October 22nd 2019',
  notifications: [
    {
      type: 'Favorite',
      users: [
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' }
      ],
      entity: {
        type: 'Track',
        name: 'Zeds Dead X DROELOE - Stars Tonight '
      }
    }, {
      type: 'Announcement',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
      hasReadMore: true
    }, {
      type: 'Repost',
      users: [ { name: 'Choice', image: 'https://source.unsplash.com/random' } ],
      entity: {
        type: 'Track',
        name: 'Zeds Dead X DROELOE - Stars Tonight '
      }
    }, {
      type: 'Follow',
      users: [ { name: 'Choice', image: 'https://source.unsplash.com/random' } ]
    }, {
      type: 'Milestone',
      achievment: 'Listen',
      value: 1000,
      entity: {
        type: 'Track',
        name: 'King Reserve'
      }
    }, {
      type: 'UserSubscription',
      users: [{ name: 'Choice', image: 'https://source.unsplash.com/random' }],
      entity: {
        count: 1,
        type: 'Track',
        name: 'King Reserve'
      }
    }
  ]
} */
var NotificationEmail = function NotificationEmail(props) {
  return _react["default"].createElement("html", null, _react["default"].createElement(_Head["default"], {
    title: props.title
  }), _react["default"].createElement(_Body["default"], props));
};

var renderNotificationsEmail = function renderNotificationsEmail(props) {
  return _server["default"].renderToString(_react["default"].createElement(NotificationEmail, props));
};

module.exports = renderNotificationsEmail;