"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.getEntity = exports.getUsers = exports.NotificationType = void 0;

var _react = _interopRequireDefault(require("react"));

var _NotificationBody = _interopRequireDefault(require("./NotificationBody"));

var _utils = require("./utils");

var _notificationMap;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var NotificationType = Object.freeze({
  Follow: 'Follow',
  Repost: 'Repost',
  Favorite: 'Favorite',
  Milestone: 'Milestone',
  UserSubscription: 'UserSubscription',
  Announcement: 'Announcement'
});
exports.NotificationType = NotificationType;
var EntityType = Object.freeze({
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
});

var HighlightText = function HighlightText(_ref) {
  var text = _ref.text;
  return _react["default"].createElement("span", {
    className: 'avenir',
    style: {
      color: '#7E1BCC',
      fontSize: '14px',
      fontWeight: '500'
    }
  }, text);
};

var BodyText = function BodyText(_ref2) {
  var text = _ref2.text,
      className = _ref2.className;
  return _react["default"].createElement("span", {
    className: "avenir ".concat(className),
    style: {
      color: '#858199',
      fontSize: '14px',
      fontWeight: '500'
    }
  }, text);
};

var getUsers = function getUsers(users) {
  var _users = _slicedToArray(users, 1),
      firstUser = _users[0];

  if (users.length > 1) {
    return _react["default"].createElement(_react["default"].Fragment, null, _react["default"].createElement(HighlightText, {
      text: firstUser.name
    }), _react["default"].createElement(BodyText, {
      text: " and ".concat((0, _utils.formatCount)(users.length - 1), " other").concat(users.length > 2 ? 's' : '')
    }));
  }

  return _react["default"].createElement(HighlightText, {
    text: firstUser.name
  });
};

exports.getUsers = getUsers;

var getEntity = function getEntity(entity) {
  if (entity.type === EntityType.Track) {
    return _react["default"].createElement(_react["default"].Fragment, null, " ", _react["default"].createElement(BodyText, {
      text: 'track '
    }), _react["default"].createElement(HighlightText, {
      text: entity.name
    }), " ");
  } else if (entity.type === EntityType.Album) {
    return _react["default"].createElement(_react["default"].Fragment, null, " ", _react["default"].createElement(BodyText, {
      text: 'album '
    }), _react["default"].createElement(HighlightText, {
      text: entity.name
    }), " ");
  } else if (entity.type === EntityType.Playlist) {
    return _react["default"].createElement(_react["default"].Fragment, null, " ", _react["default"].createElement(BodyText, {
      text: 'playlist '
    }), _react["default"].createElement(HighlightText, {
      text: entity.name
    }), " ");
  }
};

exports.getEntity = getEntity;
var notificationMap = (_notificationMap = {}, _defineProperty(_notificationMap, NotificationType.Favorite, function (notification) {
  var user = getUsers(notification.users);
  var entity = getEntity(notification.entity);
  return _react["default"].createElement("span", {
    className: 'notificationText'
  }, user, _react["default"].createElement(BodyText, {
    text: " favorited your "
  }), entity);
}), _defineProperty(_notificationMap, NotificationType.Repost, function (notification) {
  var user = getUsers(notification.users);
  var entity = getEntity(notification.entity);
  return _react["default"].createElement("span", {
    className: 'notificationText'
  }, user, _react["default"].createElement(BodyText, {
    text: " reposted your "
  }), entity);
}), _defineProperty(_notificationMap, NotificationType.Follow, function (notification) {
  var user = getUsers(notification.users);
  return _react["default"].createElement("span", {
    className: 'notificationText'
  }, user, _react["default"].createElement(BodyText, {
    text: " followed you"
  }));
}), _defineProperty(_notificationMap, NotificationType.Announcement, function (notification) {
  return _react["default"].createElement(BodyText, {
    className: 'notificationText',
    text: notification.text
  });
}), _defineProperty(_notificationMap, NotificationType.Milestone, function (notification) {
  if (notification.entity) {
    var entity = notification.entity.type.toLowerCase();
    return _react["default"].createElement("span", {
      className: 'notificationText'
    }, _react["default"].createElement(BodyText, {
      text: "Your ".concat(entity, " ")
    }), _react["default"].createElement(HighlightText, {
      text: notification.entity.name
    }), _react["default"].createElement(BodyText, {
      text: " has reached over ".concat(notification.value, " ").concat(notification.achievement, "s")
    }));
  } else {
    return _react["default"].createElement(BodyText, {
      className: 'notificationText',
      text: "Your have reached over ".concat(notification.value, " Followers ")
    });
  }
}), _defineProperty(_notificationMap, NotificationType.UserSubscription, function (notification) {
  var _notification$users = _slicedToArray(notification.users, 1),
      user = _notification$users[0];

  if (notification.entity.type === NotificationType.Track && !isNaN(notification.entity.count) && notification.entity.count > 1) {
    return _react["default"].createElement("span", {
      className: 'notificationText'
    }, _react["default"].createElement(HighlightText, {
      text: user.name
    }), _react["default"].createElement(BodyText, {
      text: " released ".concat(notification.entity.count, " new ").concat(notification.entity.type)
    }));
  }

  return _react["default"].createElement("span", {
    className: 'notificationText'
  }, _react["default"].createElement(HighlightText, {
    text: user.name
  }), _react["default"].createElement(BodyText, {
    text: " released a new ".concat(notification.entity.type, "  ").concat(notification.entity.name)
  }));
}), _notificationMap);

var getMessage = function getMessage(notification) {
  var getNotificationMessage = notificationMap[notification.type];
  if (!getNotificationMessage) return null;
  return getNotificationMessage(notification);
};

var Notification = function Notification(props) {
  var message = getMessage(props);
  return _react["default"].createElement(_NotificationBody["default"], _extends({}, props, {
    message: message
  }));
};

var _default = Notification;
exports["default"] = _default;