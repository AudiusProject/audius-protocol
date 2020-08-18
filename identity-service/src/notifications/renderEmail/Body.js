"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _Footer = _interopRequireDefault(require("./Footer"));

var _Notification = _interopRequireWildcard(require("./notifications/Notification"));

var _snippetMap;

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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

var snippetMap = (_snippetMap = {}, _defineProperty(_snippetMap, _Notification.NotificationType.Favorite, function (notification) {
  var _notification$users = _slicedToArray(notification.users, 1),
      user = _notification$users[0];

  return "".concat(user.name, " favorited your ").concat(notification.entity.name);
}), _defineProperty(_snippetMap, _Notification.NotificationType.Repost, function (notification) {
  var _notification$users2 = _slicedToArray(notification.users, 1),
      user = _notification$users2[0];

  return "".concat(user.name, " reposted your ").concat(notification.entity.name);
}), _defineProperty(_snippetMap, _Notification.NotificationType.Follow, function (notification) {
  var _notification$users3 = _slicedToArray(notification.users, 1),
      user = _notification$users3[0];

  return "".concat(user.name, " followed you");
}), _defineProperty(_snippetMap, _Notification.NotificationType.Announcement, function (notification) {
  return notification.text;
}), _defineProperty(_snippetMap, _Notification.NotificationType.Milestone, function (notification) {
  if (notification.entity) {
    var entity = notification.entity.type.toLowerCase();
    return "Your ".concat(entity, " ").concat(notification.entity.name, " has reached over ").concat(notification.value, " ").concat(notification.achievement, "s");
  } else {
    return "You have reached over ".concat(notification.value, " Followers ");
  }
}), _defineProperty(_snippetMap, _Notification.NotificationType.UserSubscription, function (notification) {
  var _notification$users4 = _slicedToArray(notification.users, 1),
      user = _notification$users4[0];

  if (notification.entity.type === _Notification.NotificationType.Track && !isNaN(notification.entity.count) && notification.entity.count > 1) {
    return "".concat(user.name, " released ").concat(notification.entity.count, " new ").concat(notification.entity.type);
  }

  return "".concat(user.name, " released a new ").concat(notification.entity.type, "  ").concat(notification.entity.name);
}), _defineProperty(_snippetMap, _Notification.NotificationType.RemixCreate, function (notification) {
  var parentTrack = notification.parentTrack;
  return "New remix of your track ".concat(parentTrack.title);
}), _defineProperty(_snippetMap, _Notification.NotificationType.RemixCosign, function (notification) {
  var parentTrackUser = notification.parentTrackUser,
      parentTracks = notification.parentTracks;
  var parentTrack = parentTracks.find(function (t) {
    return t.ownerId === parentTrackUser.userId;
  });
  return "".concat(parentTrackUser.name, " Co-signed your Remix of ").concat(parentTrack.title);
}), _snippetMap);

var mapNotification = function mapNotification(notification) {
  switch (notification.type) {
    case _Notification.NotificationType.RemixCreate:
      {
        notification.users = [notification.remixUser];
        return notification;
      }

    case _Notification.NotificationType.RemixCosign:
      {
        notification.track = notification.remixTrack;
        return notification;
      }

    default:
      {
        return notification;
      }
  }
}; // Generate snippet for email composed of the first three notification texts,
// but limited to 90 characters w/ an ellipsis


var SNIPPET_ELLIPSIS_LENGTH = 90;

var getSnippet = function getSnippet(notifications) {
  var snippet = notifications.slice(0, 3).map(function (notification) {
    return snippetMap[notification.type](notification);
  }).join(', ');
  if (snippet.length <= SNIPPET_ELLIPSIS_LENGTH) return snippet;
  var indexOfEllipsis = snippet.substring(SNIPPET_ELLIPSIS_LENGTH).indexOf(' ') + SNIPPET_ELLIPSIS_LENGTH;
  return "".concat(snippet.substring(0, indexOfEllipsis), " ...");
};

var Body = function Body(props) {
  return _react["default"].createElement("body", {
    bgcolor: "#FFFFFF",
    style: {
      backgroundColor: '#FFFFFF'
    }
  }, _react["default"].createElement("p", {
    style: {
      display: 'none',
      fontSize: '1px',
      color: '#333333',
      lineHeight: '1px',
      maxHeight: '0px',
      maxWidth: '0px',
      opacity: 0,
      overflow: 'hidden'
    },
    dangerouslySetInnerHTML: {
      __html: "".concat(getSnippet(props.notifications), "\n        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;\n        <wbr>\n        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;\n        <wbr>\n        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;\n        <wbr>\n        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;\n        <wbr>\n        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;\n        <wbr>\n        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;\n        ")
    }
  }), _react["default"].createElement("center", null, _react["default"].createElement("table", {
    align: "center",
    border: "0",
    cellpadding: "0",
    cellspacing: "0",
    width: "100%",
    id: "bodyTable",
    bgcolor: "#FFFFFF",
    style: {
      backgroundColor: '#FFFFFF'
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
    message: props.subject
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
    }, mapNotification(notification)));
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
    href: "https://audius.co/feed?openNotifications=true",
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