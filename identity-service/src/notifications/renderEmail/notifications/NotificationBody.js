'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = void 0

const _react = _interopRequireDefault(require('react'))

const _MultiUserHeader = _interopRequireDefault(require('./MultiUserHeader'))

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

const UserImage = function UserImage(_ref) {
  const user = _ref.user
  return /* #__PURE__ */ _react.default.createElement('img', {
    src: user.image || user.thumbnail,
    style: {
      height: '32px',
      width: '32px',
      borderRadius: '50%'
    }
  })
}

const TrackImage = function TrackImage(_ref2) {
  const track = _ref2.track
  return /* #__PURE__ */ _react.default.createElement('img', {
    src: track.image || track.thumbnail,
    style: {
      height: '42px',
      width: '42px',
      borderRadius: '3px'
    }
  })
}

const AnnouncementHeader = function AnnouncementHeader() {
  return /* #__PURE__ */ _react.default.createElement(
    _react.default.Fragment,
    null,
    /* #__PURE__ */ _react.default.createElement(
      'td',
      {
        colspan: '1',
        valign: 'center',
        style: {
          padding: '16px 16px 0px 16px'
        }
      },
      /* #__PURE__ */ _react.default.createElement('img', {
        src: 'https://download.audius.co/static-resources/email/announcement.png',
        style: {
          height: '32px',
          width: '32px',
          borderRadius: '50%',
          display: 'block'
        },
        alt: 'Announcement',
        titile: 'Announcement'
      })
    ),
    /* #__PURE__ */ _react.default.createElement(
      'td',
      {
        colspan: '11',
        style: {
          width: '100%',
          padding: '16px 0px 0px'
        }
      },
      /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'avenir',
          style: {
            color: '#858199',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        'Announcement'
      )
    )
  )
}

const OpenAudiusLink = function OpenAudiusLink() {
  return /* #__PURE__ */ _react.default.createElement(
    'a',
    {
      className: 'avenir',
      style: {
        width: '337px',
        color: '#C2C0CC',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '10px'
      }
    },
    'Open Audius',
    /* #__PURE__ */ _react.default.createElement('img', {
      src: 'https://download.audius.co/static-resources/email/iconArrow.png',
      style: {
        height: '8px',
        width: '8px',
        marginLeft: '4px',
        display: 'inline-block'
      },
      alt: 'Arrow Right',
      titile: 'Arrow Right',
      className: 'arrowIcon'
    })
  )
}

const WrapLink = function WrapLink(props) {
  return /* #__PURE__ */ _react.default.createElement(
    'a',
    {
      href: 'https://audius.co/feed?openNotifications=true',
      style: {
        textDecoration: 'none'
      }
    },
    props.children
  )
}

const Body = function Body(props) {
  const hasUsers = Array.isArray(props.users)
  const hasMultiUser = hasUsers && props.users.length > 1
  return /* #__PURE__ */ _react.default.createElement(
    'table',
    {
      border: '0',
      cellpadding: '0',
      cellspacing: '0',
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
    },
    /* #__PURE__ */ _react.default.createElement(
      'tr',
      null,
      /* #__PURE__ */ _react.default.createElement(
        'td',
        null,
        /* #__PURE__ */ _react.default.createElement(
          WrapLink,
          null,
          /* #__PURE__ */ _react.default.createElement(
            'table',
            {
              border: '0',
              cellpadding: '0',
              cellspacing: '0',
              style: {
                borderCollapse: 'separate',
                height: 'auto',
                width: '100%'
              }
            },
            props.type === 'Announcement' &&
              /* #__PURE__ */ _react.default.createElement(
                'tr',
                null,
                /* #__PURE__ */ _react.default.createElement(
                  AnnouncementHeader,
                  null
                )
              ),
            props.title &&
              /* #__PURE__ */ _react.default.createElement(
                'tr',
                null,
                /* #__PURE__ */ _react.default.createElement(
                  'td',
                  {
                    colspan: '12',
                    valign: 'center',
                    style: {
                      padding: '16px 16px 0px',
                      paddingTop: '16px',
                      borderRadius: '4px'
                    }
                  },
                  props.title
                )
              ),
            hasMultiUser &&
              /* #__PURE__ */ _react.default.createElement(
                'tr',
                null,
                /* #__PURE__ */ _react.default.createElement(
                  'td',
                  {
                    colspan: '12',
                    valign: 'center',
                    style: {
                      padding: '16px 16px 0px',
                      paddingTop:
                        props.type === 'Announcement' || props.title
                          ? '8px'
                          : '16px',
                      borderRadius: '4px'
                    }
                  },
                  /* #__PURE__ */ _react.default.createElement(
                    _MultiUserHeader.default,
                    {
                      users: props.users
                    }
                  )
                )
              ),
            /* #__PURE__ */ _react.default.createElement(
              'tr',
              null,
              hasUsers &&
                !hasMultiUser &&
                /* #__PURE__ */ _react.default.createElement(
                  'td',
                  {
                    colspan: '1',
                    valign: 'center',
                    style: {
                      padding: '12px 0px 8px 16px',
                      width: '60px'
                    }
                  },
                  /* #__PURE__ */ _react.default.createElement(UserImage, {
                    user: props.users[0]
                  })
                ),
              /* #__PURE__ */ _react.default.createElement(
                'td',
                {
                  colspan: hasUsers && !hasMultiUser ? 11 : 12,
                  valign: 'center',
                  style: {
                    padding: '12px 16px 8px',
                    paddingLeft: hasUsers && !hasMultiUser ? '12px' : '16px',
                    paddingTop: props.title
                      ? '8px'
                      : hasUsers && !hasMultiUser
                      ? '12px'
                      : '16px',
                    width: '100%'
                  }
                },
                props.message
              )
            ),
            props.trackMessage &&
              /* #__PURE__ */ _react.default.createElement(
                'tr',
                null,
                /* #__PURE__ */ _react.default.createElement(
                  'td',
                  {
                    colspan: '1',
                    valign: 'center',
                    style: {
                      padding: '6px 0px 8px 16px',
                      width: '60px'
                    }
                  },
                  /* #__PURE__ */ _react.default.createElement(TrackImage, {
                    track: props.track
                  })
                ),
                /* #__PURE__ */ _react.default.createElement(
                  'td',
                  {
                    colspan: 11,
                    valign: 'center',
                    style: {
                      padding: '6px 16px 8px',
                      paddingLeft: '12px',
                      width: '100%'
                    }
                  },
                  props.trackMessage
                )
              ),
            props.twitter &&
              /* #__PURE__ */ _react.default.createElement(
                'tr',
                null,
                /* #__PURE__ */ _react.default.createElement(
                  'td',
                  {
                    colspan: '12',
                    style: {
                      padding: '4px 0px 16px 16px',
                      borderRadius: '4px'
                    }
                  },
                  /* #__PURE__ */ _react.default.createElement(
                    'a',
                    {
                      href: props.twitter.href,
                      target: '_blank',
                      style: {
                        textDecoration: 'none'
                      }
                    },
                    /* #__PURE__ */ _react.default.createElement(
                      'table',
                      {
                        cellspacing: '0',
                        cellpadding: '0',
                        style: {
                          margin: '0px'
                        }
                      },
                      /* #__PURE__ */ _react.default.createElement(
                        'tr',
                        null,
                        /* #__PURE__ */ _react.default.createElement(
                          'td',
                          {
                            style: {
                              borderRadius: '4px',
                              padding: '4px 8px',
                              margin: '0px'
                            },
                            bgcolor: '#1BA1F1'
                          },
                          /* #__PURE__ */ _react.default.createElement(
                            'table',
                            {
                              cellspacing: '0',
                              cellpadding: '0',
                              style: {
                                margin: '0px'
                              }
                            },
                            /* #__PURE__ */ _react.default.createElement(
                              'tr',
                              null,
                              /* #__PURE__ */ _react.default.createElement(
                                'td',
                                {
                                  valign: 'center',
                                  style: {
                                    margin: '0px'
                                  }
                                },
                                /* #__PURE__ */ _react.default.createElement(
                                  'img',
                                  {
                                    src: 'https://download.audius.co/static-resources/email/iconTwitterWhite.png',
                                    alt: 'twitter',
                                    style: {
                                      height: '18px',
                                      width: '18px',
                                      padding: '0px',
                                      marginRight: '8px',
                                      verticalAlign: 'text-bottom'
                                    }
                                  }
                                )
                              ),
                              /* #__PURE__ */ _react.default.createElement(
                                'td',
                                {
                                  valign: 'center',
                                  style: {
                                    margin: '0px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#ffffff',
                                    textDecoration: 'none'
                                  }
                                },
                                props.twitter.message
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              ),
            props.hasReadMore &&
              /* #__PURE__ */ _react.default.createElement(
                'tr',
                null,
                /* #__PURE__ */ _react.default.createElement(
                  'td',
                  {
                    colspan: '12',
                    valign: 'center',
                    className: 'avenir',
                    style: {
                      padding: '0px 16px 14px',
                      color: '#7E1BCC',
                      fontSize: '14px',
                      fontWeight: '500'
                    }
                  },
                  'Read More'
                )
              ),
            /* #__PURE__ */ _react.default.createElement(
              'tr',
              null,
              /* #__PURE__ */ _react.default.createElement(
                'td',
                {
                  valign: 'center',
                  colspan: '12',
                  style: {
                    padding: '0px 16px 14px'
                  }
                },
                /* #__PURE__ */ _react.default.createElement(
                  OpenAudiusLink,
                  null
                )
              )
            )
          )
        )
      )
    )
  )
}

const _default = Body
exports.default = _default
