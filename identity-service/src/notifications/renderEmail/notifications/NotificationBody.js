"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _MultiUserHeader = _interopRequireDefault(require("./MultiUserHeader"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var UserImage = function UserImage(_ref) {
  var user = _ref.user;
  return _react["default"].createElement("img", {
    src: user.image || user.thumbnail,
    style: {
      height: '32px',
      width: '32px',
      borderRadius: '50%'
    }
  });
};

var TrackImage = function TrackImage(_ref2) {
  var track = _ref2.track;
  return _react["default"].createElement("img", {
    src: track.image || track.thumbnail,
    style: {
      height: '42px',
      width: '42px',
      borderRadius: '3px'
    }
  });
};

var AnnouncementHeader = function AnnouncementHeader() {
  return _react["default"].createElement(_react["default"].Fragment, null, _react["default"].createElement("td", {
    colspan: "1",
    valign: "center",
    style: {
      padding: '16px 16px 0px 16px'
    }
  }, _react["default"].createElement("img", {
    src: 'https://download.audius.co/static-resources/email/announcement.png',
    style: {
      height: '32px',
      width: '32px',
      borderRadius: '50%',
      display: 'block'
    },
    alt: "Announcement",
    titile: "Announcement"
  })), _react["default"].createElement("td", {
    colspan: "11",
    style: {
      width: '100%',
      padding: '16px 0px 0px'
    }
  }, _react["default"].createElement("span", {
    className: 'avenir',
    style: {
      color: '#858199',
      fontSize: '16px',
      fontWeight: 'bold'
    }
  }, 'Announcement')));
};

var OpenAudiusLink = function OpenAudiusLink() {
  return _react["default"].createElement("a", {
    className: 'avenir',
    style: {
      width: '337px',
      color: '#C2C0CC',
      fontSize: '12px',
      fontWeight: 600,
      lineHeight: '10px'
    }
  }, 'Open Audius', _react["default"].createElement("img", {
    src: "https://download.audius.co/static-resources/email/iconArrow.png",
    style: {
      height: '8px',
      width: '8px',
      marginLeft: '4px',
      display: 'inline-block'
    },
    alt: "Arrow Right",
    titile: "Arrow Right",
    className: "arrowIcon"
  }));
};

var WrapLink = function WrapLink(props) {
  return _react["default"].createElement("a", {
    href: "https://audius.co/feed?openNotifications=true",
    style: {
      textDecoration: 'none'
    }
  }, props.children);
};

var Body = function Body(props) {
  var hasUsers = Array.isArray(props.users);
  var hasMultiUser = hasUsers && props.users.length > 1;
  return _react["default"].createElement("table", {
    border: "0",
    cellpadding: "0",
    cellspacing: "0",
    style: {
      borderCollapse: 'separate',
      border: '1px solid rgba(133,129,153,0.2)',
      borderColor: 'rgba(133,129,153,0.2)',
      borderRadius: '4px',
      height: 'auto',
      width: '100%',
      maxWidth: '396px',
      marginBottom: '8px'
    }
  }, _react["default"].createElement("tr", null, _react["default"].createElement("td", null, _react["default"].createElement(WrapLink, null, _react["default"].createElement("table", {
    border: "0",
    cellpadding: "0",
    cellspacing: "0",
    style: {
      borderCollapse: 'separate',
      height: 'auto',
      width: '100%'
    }
  }, props.type === 'Announcement' && _react["default"].createElement("tr", null, _react["default"].createElement(AnnouncementHeader, null)), props.title && _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    colspan: '12',
    valign: "center",
    style: {
      padding: '16px 16px 0px',
      paddingTop: '16px',
      borderRadius: '4px'
    }
  }, props.title)), hasMultiUser && _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    colspan: '12',
    valign: "center",
    style: {
      padding: '16px 16px 0px',
      paddingTop: props.type === 'Announcement' || props.title ? '8px' : '16px',
      borderRadius: '4px'
    }
  }, _react["default"].createElement(_MultiUserHeader["default"], {
    users: props.users
  }))), _react["default"].createElement("tr", null, hasUsers && !hasMultiUser && _react["default"].createElement("td", {
    colspan: '1',
    valign: "center",
    style: {
      padding: '12px 0px 8px 16px',
      width: '60px'
    }
  }, _react["default"].createElement(UserImage, {
    user: props.users[0]
  })), _react["default"].createElement("td", {
    colspan: hasUsers && !hasMultiUser ? 11 : 12,
    valign: "center",
    style: {
      padding: '12px 16px 8px',
      paddingLeft: hasUsers && !hasMultiUser ? '12px' : '16px',
      paddingTop: props.title ? '8px' : hasUsers && !hasMultiUser ? '12px' : '16px',
      width: '100%'
    }
  }, props.message)), props.trackMessage && _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    colspan: '1',
    valign: "center",
    style: {
      padding: '6px 0px 8px 16px',
      width: '60px'
    }
  }, _react["default"].createElement(TrackImage, {
    track: props.track
  })), _react["default"].createElement("td", {
    colspan: 11,
    valign: "center",
    style: {
      padding: '6px 16px 8px',
      paddingLeft: '12px',
      width: '100%'
    }
  }, props.trackMessage)), props.twitter && _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    colspan: '12',
    style: {
      padding: '4px 0px 16px 16px',
      borderRadius: '4px'
    }
  }, _react["default"].createElement("a", {
    href: props.twitter.href,
    target: "_blank",
    style: {
      textDecoration: 'none'
    }
  }, _react["default"].createElement("table", {
    cellspacing: "0",
    cellpadding: "0",
    style: {
      margin: '0px'
    }
  }, _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    style: {
      borderRadius: '4px',
      padding: '4px 8px',
      margin: '0px'
    },
    bgcolor: "#1BA1F1"
  }, _react["default"].createElement("table", {
    cellspacing: "0",
    cellpadding: "0",
    style: {
      margin: '0px'
    }
  }, _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    valign: "center",
    style: {
      margin: '0px'
    }
  }, _react["default"].createElement("img", {
    src: "https://download.audius.co/static-resources/email/iconTwitterWhite.png",
    alt: "twitter",
    style: {
      height: '18px',
      width: '18px',
      padding: '0px',
      marginRight: '8px',
      verticalAlign: 'text-bottom'
    }
  })), _react["default"].createElement("td", {
    valign: "center",
    style: {
      margin: '0px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
      textDecoration: 'none'
    }
  }, props.twitter.message))))))))), props.hasReadMore && _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    colspan: '12',
    valign: "center",
    className: 'avenir',
    style: {
      padding: '0px 16px 14px',
      color: '#7E1BCC',
      fontSize: '14px',
      fontWeight: '500'
    }
  }, 'Read More')), _react["default"].createElement("tr", null, _react["default"].createElement("td", {
    valign: "center",
    colspan: '12',
    style: {
      padding: '0px 16px 14px'
    }
  }, _react["default"].createElement(OpenAudiusLink, null))))))));
};

var _default = Body;
exports["default"] = _default;