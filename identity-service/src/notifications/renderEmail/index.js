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
var props = {
  notifications: [{
    type: 'Repost',
    users: [{
      name: 'hareesh',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Track',
      name: 'Start Of A New Day'
    }
  }, {
    type: 'Repost',
    users: [{
      name: 'hareesh',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Track',
      name: 'Happy'
    }
  }, {
    type: 'UserSubscription',
    users: [{
      name: 'ray',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Playlist',
      count: 1,
      name: 'ray-playlist-1'
    }
  }, {
    type: 'UserSubscription',
    users: [{
      name: 'ray',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Track',
      count: 1,
      name: 'Start Of A New Day'
    }
  }, {
    type: 'Follow',
    users: [{
      name: 'hareesh',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'ray',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Track',
      name: 'Start Of A New Day'
    }
  }, {
    type: 'UserSubscription',
    users: [{
      name: 'ray',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Album',
      count: 1,
      name: 'ray-album-1'
    }
  }, {
    type: 'Follow',
    users: [{
      name: 'christina',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'michael2',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'ray',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Playlist',
      name: 'joey-playlist'
    }
  }, {
    type: 'Repost',
    users: [{
      name: 'sid',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'michael2',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'christina',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'ray',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'hareesh',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }],
    entity: {
      type: 'Playlist',
      name: 'joey-playlist'
    }
  }, {
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
      name: 'hareesh',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }, {
      name: 'ray',
      image: 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
    }]
  }, {
    type: 'Announcement',
    text: 'Here is an email testtttttt',
    hasReadMore: true
  }],
  title: 'Daily Email - hareesh2@audius.co',
  subject: 'Unread notifications from yesterday'
}; // const props = { notifications:
//   [ { type: 'Milestone',
//     achievement: 'Listen',
//     entity: { type: 'Track', name: 'Scared Butterfly' },
//     value: 10 },
//   { type: 'Follow',
//     users:
//        [ { name: 'roneil',
//          image: 'https://download.audius.co/static-resources/email/user.png' } ],
//     entity: { type: 'Playlist', name: 'forrest-playlist' } },
//   { type: 'Repost',
//     users:
//        [ { name: 'roneil',
//          image: 'https://download.audius.co/static-resources/email/user.png' } ],
//     entity: { type: 'Track', name: 'fly_theremin_1' } },
//   { type: 'Repost',
//     users:
//        [ { name: 'roneil',
//          image: 'https://download.audius.co/static-resources/email/user.png' } ],
//     entity: { type: 'Track', name: 'space_rubberband_2' } },
//   { type: 'Repost',
//     users:
//        [ { name: 'roneil',
//          image: 'https://download.audius.co/static-resources/email/user.png' } ],
//     entity: { type: 'Track', name: 'space_rubberband_1' } } ],
// title: 'Daily Email - hareesh12@audius.co',
// subject: 'Unread notifications from yesterday' }

console.log(renderNotificationsEmail(props));