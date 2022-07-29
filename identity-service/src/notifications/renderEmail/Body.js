"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _Footer = _interopRequireDefault(require("./Footer"));

var _Notification = _interopRequireDefault(require("./notifications/Notification"));

var _constants = require("../constants");

var _snippetMap;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var AudiusImage = function AudiusImage() {
  return /*#__PURE__*/_react["default"].createElement("img", {
    src: "https://gallery.mailchimp.com/f351897a27ff0a641b8acd9ab/images/b1070e55-9487-4acb-abce-e755484cce46.png",
    style: {
      maxWidth: '240px',
      margin: '27px auto'
    },
    alt: "Audius Logo"
  });
};

var WhatYouMissed = function WhatYouMissed() {
  return /*#__PURE__*/_react["default"].createElement("img", {
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
  return /*#__PURE__*/_react["default"].createElement("p", {
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

var getNumberSuffix = function getNumberSuffix(num) {
  if (num === 1) return 'st';else if (num === 2) return 'nd';else if (num === 3) return 'rd';
  return 'th';
};

var snippetMap = (_snippetMap = {}, _defineProperty(_snippetMap, _constants.notificationTypes.Favorite.base, function (notification) {
  var _notification$users = _slicedToArray(notification.users, 1),
      user = _notification$users[0];

  return "".concat(user.name, " favorited your ").concat(notification.entity.type.toLowerCase(), " ").concat(notification.entity.name);
}), _defineProperty(_snippetMap, _constants.notificationTypes.Repost.base, function (notification) {
  var _notification$users2 = _slicedToArray(notification.users, 1),
      user = _notification$users2[0];

  return "".concat(user.name, " reposted your ").concat(notification.entity.type.toLowerCase(), " ").concat(notification.entity.name);
}), _defineProperty(_snippetMap, _constants.notificationTypes.Follow, function (notification) {
  var _notification$users3 = _slicedToArray(notification.users, 1),
      user = _notification$users3[0];

  return "".concat(user.name, " followed you");
}), _defineProperty(_snippetMap, _constants.notificationTypes.Announcement, function (notification) {
  return notification.text;
}), _defineProperty(_snippetMap, _constants.notificationTypes.Milestone, function (notification) {
  if (notification.entity) {
    var entity = notification.entity.type.toLowerCase();
    return "Your ".concat(entity, " ").concat(notification.entity.name, " has reached over ").concat(notification.value, " ").concat(notification.achievement, "s");
  } else {
    return "You have reached over ".concat(notification.value, " Followers");
  }
}), _defineProperty(_snippetMap, _constants.notificationTypes.TrendingTrack, function (notification) {
  var rank = notification.rank;
  var suffix = getNumberSuffix(rank);
  return "Your Track ".concat(notification.entity.title, " is ").concat(notification.rank).concat(suffix, " on Trending Right Now!");
}), _defineProperty(_snippetMap, _constants.notificationTypes.UserSubscription, function (notification) {
  var _notification$users4 = _slicedToArray(notification.users, 1),
      user = _notification$users4[0];

  if (notification.entity.type === _constants.notificationTypes.Track && !isNaN(notification.entity.count) && notification.entity.count > 1) {
    return "".concat(user.name, " released ").concat(notification.entity.count, " new ").concat(notification.entity.type);
  }

  return "".concat(user.name, " released a new ").concat(notification.entity.type.toLowerCase(), " ").concat(notification.entity.name);
}), _defineProperty(_snippetMap, _constants.notificationTypes.RemixCreate, function (notification) {
  var parentTrack = notification.parentTrack;
  return "New remix of your track ".concat(parentTrack.title);
}), _defineProperty(_snippetMap, _constants.notificationTypes.RemixCosign, function (notification) {
  var parentTrackUser = notification.parentTrackUser,
      parentTracks = notification.parentTracks;
  var parentTrack = parentTracks.find(function (t) {
    return t.ownerId === parentTrackUser.userId;
  });
  return "".concat(parentTrackUser.name, " Co-signed your Remix of ").concat(parentTrack.title);
}), _defineProperty(_snippetMap, _constants.notificationTypes.ChallengeReward, function (notification) {
  return "You've earned $AUDIO for completing challenges";
}), _defineProperty(_snippetMap, _constants.notificationTypes.AddTrackToPlaylist, function (notification) {
  return "".concat(notification.playlistOwner.name, " added ").concat(notification.track.title, " to ").concat(notification.playlist.playlist_name);
}), _defineProperty(_snippetMap, _constants.notificationTypes.TipReceive, function (notification) {
  return "".concat(notification.sendingUser.name, " sent you a tip of ").concat(notification.amount, " $AUDIO");
}), _defineProperty(_snippetMap, _constants.notificationTypes.Reaction, function (notification) {
  return "".concat(notification.reactingUser.name, " reacted to your tip of ").concat(notification.amount, " $AUDIO");
}), _defineProperty(_snippetMap, _constants.notificationTypes.SupporterRankUp, function (notification) {
  return "".concat(notification.sendingUser.name, " became your #").concat(notification.rank, " top supporter");
}), _defineProperty(_snippetMap, _constants.notificationTypes.SupportingRankUp, function (notification) {
  return "You're now ".concat(notification.receivingUser.name, "'s #").concat(notification.rank, " top supporter");
}), _snippetMap);

var mapNotification = function mapNotification(notification) {
  switch (notification.type) {
    case _constants.notificationTypes.RemixCreate:
      {
        notification.users = [notification.remixUser];
        return notification;
      }

    case _constants.notificationTypes.RemixCosign:
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
  return /*#__PURE__*/_react["default"].createElement("body", {
    bgcolor: "#FFFFFF",
    style: {
      backgroundColor: '#FFFFFF'
    }
  }, /*#__PURE__*/_react["default"].createElement("p", {
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
  }), /*#__PURE__*/_react["default"].createElement("center", null, /*#__PURE__*/_react["default"].createElement("table", {
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
  }, /*#__PURE__*/_react["default"].createElement("tr", null, /*#__PURE__*/_react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell"
  }, /*#__PURE__*/_react["default"].createElement(AudiusImage, null))), /*#__PURE__*/_react["default"].createElement("tr", null, /*#__PURE__*/_react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell"
  }, /*#__PURE__*/_react["default"].createElement(WhatYouMissed, null))), /*#__PURE__*/_react["default"].createElement("tr", null, /*#__PURE__*/_react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell"
  }, /*#__PURE__*/_react["default"].createElement(UnreadNotifications, {
    message: props.subject
  }))), /*#__PURE__*/_react["default"].createElement("tr", null, /*#__PURE__*/_react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell",
    style: {
      borderRadius: '4px',
      maxWidth: '396px',
      marginBottom: '32px'
    }
  }, props.notifications.map(function (notification, ind) {
    return /*#__PURE__*/_react["default"].createElement(_Notification["default"], _extends({
      key: ind
    }, mapNotification(notification)));
  }))), /*#__PURE__*/_react["default"].createElement("tr", null, /*#__PURE__*/_react["default"].createElement("td", {
    align: "center",
    valign: "top",
    id: "bodyCell",
    style: {
      padding: '24px 0px 32px',
      width: '100%'
    }
  }, /*#__PURE__*/_react["default"].createElement("table", {
    cellspacing: "0",
    cellpadding: "0",
    style: {
      margin: '0px auto'
    }
  }, /*#__PURE__*/_react["default"].createElement("tr", null, /*#__PURE__*/_react["default"].createElement("td", {
    style: {
      borderRadius: '17px',
      margin: '0px auto'
    },
    bgcolor: "#7E1BCC"
  }, /*#__PURE__*/_react["default"].createElement("a", {
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
  }, "See more on Audius")))))), /*#__PURE__*/_react["default"].createElement("tr", null, /*#__PURE__*/_react["default"].createElement("td", {
    style: {
      paddingBottom: '25px'
    }
  }, /*#__PURE__*/_react["default"].createElement(_Footer["default"], {
    copyrightYear: props.copyrightYear
  }))))));
};

var _default = Body;
exports["default"] = _default;