'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default =
  exports.getTrackLink =
  exports.getEntity =
  exports.getUsers =
    void 0

const _react = _interopRequireDefault(require('react'))

const _formatNotificationMetadata = require('../../formatNotificationMetadata')

const _NotificationBody = _interopRequireDefault(require('./NotificationBody'))

const _Icons = require('./Icons')

const _constants = require('../../constants')

const _utils = require('../../processNotifications/utils')

let _notificationMap

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

function _extends() {
  _extends =
    Object.assign ||
    function (target) {
      for (let i = 1; i < arguments.length; i++) {
        const source = arguments[i]
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key]
          }
        }
      }
      return target
    }
  return _extends.apply(this, arguments)
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    })
  } else {
    obj[key] = value
  }
  return obj
}

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  )
}

function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
  )
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen)
  let n = Object.prototype.toString.call(o).slice(8, -1)
  if (n === 'Object' && o.constructor) n = o.constructor.name
  if (n === 'Map' || n === 'Set') return Array.from(o)
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen)
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i]
  }
  return arr2
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === 'undefined' || !(Symbol.iterator in Object(arr))) return
  const _arr = []
  let _n = true
  let _d = false
  let _e
  try {
    for (
      var _i = arr[Symbol.iterator](), _s;
      !(_n = (_s = _i.next()).done);
      _n = true
    ) {
      _arr.push(_s.value)
      if (i && _arr.length === i) break
    }
  } catch (err) {
    _d = true
    _e = err
  } finally {
    try {
      if (!_n && _i.return != null) _i.return()
    } finally {
      if (_d) throw _e
    }
  }
  return _arr
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr
}

const challengeRewardsConfig = {
  rd: {
    title: 'Invite your Friends',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.IncomingEnvelopeIcon,
      null
    )
  },
  r: {
    title: 'Invite your Friends',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.IncomingEnvelopeIcon,
      null
    )
  },
  rv: {
    title: 'Invite your Fans',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.IncomingEnvelopeIcon,
      null
    )
  },
  v: {
    title: 'Link Verified Accounts',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.WhiteHeavyCheckMarkIcon,
      null
    )
  },
  l: {
    title: 'Listening Streak: 7 Days',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.HeadphoneIcon,
      null
    )
  },
  m: {
    title: 'Get the Audius Mobile App',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.MobilePhoneWithArrowIcon,
      null
    )
  },
  p: {
    title: 'Complete Your Profile',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.WhiteHeavyCheckMarkIcon,
      null
    )
  },
  u: {
    title: 'Upload 3 Tracks',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.MultipleMusicalNotesIcon,
      null
    )
  },
  ft: {
    title: 'Send Your First Tip',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.MoneyMouthFaceIcon,
      null
    )
  },
  fp: {
    title: 'Create a Playlist',
    icon: /* #__PURE__ */ _react.default.createElement(
      _Icons.TrebleClefIcon,
      null
    )
  }
}
const EntityType = Object.freeze({
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
})

const HighlightText = function HighlightText(_ref) {
  const text = _ref.text
  return /* #__PURE__ */ _react.default.createElement(
    'span',
    {
      className: 'avenir',
      style: {
        color: '#7E1BCC',
        fontSize: '14px',
        fontWeight: '500'
      }
    },
    text
  )
}

const BodyText = function BodyText(_ref2) {
  const text = _ref2.text
  const className = _ref2.className
  return /* #__PURE__ */ _react.default.createElement(
    'span',
    {
      className: 'avenir '.concat(className),
      style: {
        color: '#858199',
        fontSize: '14px',
        fontWeight: '500'
      }
    },
    text
  )
}

const getUsers = function getUsers(users) {
  const _users = _slicedToArray(users, 1)
  const firstUser = _users[0]

  if (users.length > 1) {
    const userCount = users.length - 1
    return /* #__PURE__ */ _react.default.createElement(
      _react.default.Fragment,
      null,
      /* #__PURE__ */ _react.default.createElement(HighlightText, {
        text: firstUser.name
      }),
      /* #__PURE__ */ _react.default.createElement(BodyText, {
        text: ' and '
          .concat(userCount.toLocaleString(), ' other')
          .concat(users.length > 2 ? 's' : '')
      })
    )
  }

  return /* #__PURE__ */ _react.default.createElement(HighlightText, {
    text: firstUser.name
  })
}

exports.getUsers = getUsers

const getEntity = function getEntity(entity) {
  if (entity.type === EntityType.Track) {
    return /* #__PURE__ */ _react.default.createElement(
      _react.default.Fragment,
      null,
      ' ',
      /* #__PURE__ */ _react.default.createElement(BodyText, {
        text: 'track '
      }),
      /* #__PURE__ */ _react.default.createElement(HighlightText, {
        text: entity.name
      }),
      ' '
    )
  } else if (entity.type === EntityType.Album) {
    return /* #__PURE__ */ _react.default.createElement(
      _react.default.Fragment,
      null,
      ' ',
      /* #__PURE__ */ _react.default.createElement(BodyText, {
        text: 'album '
      }),
      /* #__PURE__ */ _react.default.createElement(HighlightText, {
        text: entity.name
      }),
      ' '
    )
  } else if (entity.type === EntityType.Playlist) {
    return /* #__PURE__ */ _react.default.createElement(
      _react.default.Fragment,
      null,
      ' ',
      /* #__PURE__ */ _react.default.createElement(BodyText, {
        text: 'playlist '
      }),
      /* #__PURE__ */ _react.default.createElement(HighlightText, {
        text: entity.name
      }),
      ' '
    )
  }
}

exports.getEntity = getEntity
const notificationMap =
  ((_notificationMap = {}),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.Favorite.base,
    function (notification) {
      const user = getUsers(notification.users)
      const entity = getEntity(notification.entity)
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        user,
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' favorited your '
        }),
        entity
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.Repost.base,
    function (notification) {
      const user = getUsers(notification.users)
      const entity = getEntity(notification.entity)
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        user,
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' reposted your '
        }),
        entity
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.Follow,
    function (notification) {
      const user = getUsers(notification.users)
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        user,
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' followed you'
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.Announcement,
    function (notification) {
      return /* #__PURE__ */ _react.default.createElement(BodyText, {
        className: 'notificationText',
        text: notification.text
      })
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.Milestone,
    function (notification) {
      if (notification.entity) {
        const entity = notification.entity.type.toLowerCase()
        const highlight = notification.entity.name
        const count = notification.value
        return /* #__PURE__ */ _react.default.createElement(
          'span',
          {
            className: 'notificationText'
          },
          /* #__PURE__ */ _react.default.createElement(BodyText, {
            text: 'Your '.concat(entity, ' ')
          }),
          /* #__PURE__ */ _react.default.createElement(HighlightText, {
            text: highlight
          }),
          /* #__PURE__ */ _react.default.createElement(BodyText, {
            text: ' has reached over '
              .concat(count.toLocaleString(), ' ')
              .concat(notification.achievement, 's')
          })
        )
      } else {
        return /* #__PURE__ */ _react.default.createElement(BodyText, {
          className: 'notificationText',
          text: 'You have reached over '.concat(
            notification.value,
            ' Followers '
          )
        })
      }
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.TrendingTrack,
    function (notification) {
      const highlight = notification.entity.title
      const rank = notification.rank
      const rankSuffix = (0, _formatNotificationMetadata.getRankSuffix)(rank)
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: 'Your Track '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: highlight
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' is '
            .concat(rank)
            .concat(rankSuffix, ' on Trending Right Now! \uD83C\uDF7E')
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.UserSubscription,
    function (notification) {
      const _notification$users = _slicedToArray(notification.users, 1)
      const user = _notification$users[0]

      if (
        notification.entity.type === _constants.notificationTypes.Track &&
        !isNaN(notification.entity.count) &&
        notification.entity.count > 1
      ) {
        return /* #__PURE__ */ _react.default.createElement(
          'span',
          {
            className: 'notificationText'
          },
          /* #__PURE__ */ _react.default.createElement(HighlightText, {
            text: user.name
          }),
          /* #__PURE__ */ _react.default.createElement(BodyText, {
            text: ' released '
              .concat(notification.entity.count, ' new ')
              .concat(notification.entity.type)
          })
        )
      }

      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: user.name
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' released a new '
            .concat(notification.entity.type, ' ')
            .concat(notification.entity.name)
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.RemixCreate,
    function (notification) {
      const remixUser = notification.remixUser
      const remixTrack = notification.remixTrack
      const parentTrackUser = notification.parentTrackUser
      const parentTrack = notification.parentTrack
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: remixTrack.title
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' by '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: remixUser.name
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.RemixCosign,
    function (notification) {
      const parentTrackUser = notification.parentTrackUser
      const parentTracks = notification.parentTracks
      const parentTrack = parentTracks.find(function (t) {
        return t.owner_id === parentTrackUser.user_id
      })
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: parentTrackUser.name
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' Co-signed your Remix of '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: parentTrack.title
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.ChallengeReward,
    function (notification) {
      const rewardAmount = notification.rewardAmount
      const _challengeRewardsConf =
        challengeRewardsConfig[notification.challengeId]
      const title = _challengeRewardsConf.title
      const icon = _challengeRewardsConf.icon
      let bodyText

      if (notification.challengeId === 'rd') {
        bodyText = 'You\u2019ve received '.concat(
          rewardAmount,
          ' $AUDIO for being referred! Invite your friends to join to earn more!'
        )
      } else {
        bodyText = 'You\u2019ve earned '.concat(
          rewardAmount,
          ' $AUDIO for completing this challenge!'
        )
      }

      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(
          'table',
          {
            cellspacing: '0',
            cellpadding: '0',
            style: {
              marginBottom: '4px'
            }
          },
          /* #__PURE__ */ _react.default.createElement(
            'tr',
            null,
            /* #__PURE__ */ _react.default.createElement('td', null, icon),
            /* #__PURE__ */ _react.default.createElement(
              'td',
              null,
              /* #__PURE__ */ _react.default.createElement(HighlightText, {
                text: title
              })
            )
          )
        ),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: bodyText
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.AddTrackToPlaylist,
    function (notification) {
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: notification.playlistOwner.name
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' added your track '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: notification.track.title
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' to their playlist '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: notification.playlist.playlist_name
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.Reaction,
    function (notification) {
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: (0, _utils.capitalize)(notification.reactingUser.name)
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' reacted to your tip of '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: notification.amount
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' $AUDIO'
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.SupporterRankUp,
    function (notification) {
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: (0, _utils.capitalize)(notification.sendingUser.name)
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' became your '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: '#'.concat(notification.rank)
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' Top Supporter!'
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.SupportingRankUp,
    function (notification) {
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: "You're now "
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: (0, _utils.capitalize)(notification.receivingUser.name)
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: "'s "
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: '#'.concat(notification.rank)
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' Top Supporter!'
        })
      )
    }
  ),
  _defineProperty(
    _notificationMap,
    _constants.notificationTypes.TipReceive,
    function (notification) {
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: (0, _utils.capitalize)(notification.sendingUser.name)
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' sent you a tip of '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: notification.amount
        }),
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: ' $AUDIO'
        })
      )
    }
  ),
  _notificationMap)

const getMessage = function getMessage(notification) {
  const getNotificationMessage = notificationMap[notification.type]
  if (!getNotificationMessage) return null
  return getNotificationMessage(notification)
}

const getTitle = function getTitle(notification) {
  switch (notification.type) {
    case _constants.notificationTypes.RemixCreate: {
      const parentTrack = notification.parentTrack
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(BodyText, {
          text: 'New remix of your track '
        }),
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: parentTrack.title
        })
      )
    }

    default:
      return null
  }
}

const getTrackMessage = function getTrackMessage(notification) {
  switch (notification.type) {
    case _constants.notificationTypes.RemixCosign: {
      const remixTrack = notification.remixTrack
      return /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          className: 'notificationText'
        },
        /* #__PURE__ */ _react.default.createElement(HighlightText, {
          text: remixTrack.title
        })
      )
    }

    default:
      return null
  }
}

const getTrackLink = function getTrackLink(track) {
  return 'https://audius.co/'.concat(track.route_id, '-').concat(track.track_id)
}

exports.getTrackLink = getTrackLink

const getTwitter = function getTwitter(notification) {
  switch (notification.type) {
    case _constants.notificationTypes.RemixCreate: {
      const parentTrack = notification.parentTrack
      const parentTrackUser = notification.parentTrackUser
      const remixUser = notification.remixUser
      const remixTrack = notification.remixTrack
      const twitterHandle = parentTrackUser.twitterHandle
        ? '@'.concat(parentTrackUser.twitterHandle)
        : parentTrackUser.name
      const text = 'New remix of '
        .concat(parentTrack.title, ' by ')
        .concat(twitterHandle, ' on @audius #Audius')
      const url = getTrackLink(remixTrack)
      return {
        message: 'Share With Your Friends',
        href: 'http://twitter.com/share?url='
          .concat(encodeURIComponent(url), '&text=')
          .concat(encodeURIComponent(text))
      }
    }

    case _constants.notificationTypes.RemixCosign: {
      const parentTracks = notification.parentTracks
      const _parentTrackUser = notification.parentTrackUser
      const _remixTrack = notification.remixTrack

      const _parentTrack = parentTracks.find(function (t) {
        return t.owner_id === _parentTrackUser.user_id
      })

      const _url = getTrackLink(_remixTrack)

      const _twitterHandle = _parentTrackUser.twitterHandle
        ? '@'.concat(_parentTrackUser.twitterHandle)
        : _parentTrackUser.name

      const _text = 'My remix of '
        .concat(_parentTrack.title, ' was Co-Signed by ')
        .concat(_twitterHandle, ' on @audius #Audius')

      return {
        message: 'Share With Your Friends',
        href: 'http://twitter.com/share?url='
          .concat(encodeURIComponent(_url), '&text=')
          .concat(encodeURIComponent(_text))
      }
    }

    case _constants.notificationTypes.TrendingTrack: {
      const rank = notification.rank
      const entity = notification.entity

      const _url2 = getTrackLink(entity)

      const rankSuffix = (0, _formatNotificationMetadata.getRankSuffix)(rank)

      const _text2 = 'My track '
        .concat(entity.title, ' is trending ')
        .concat(rank)
        .concat(rankSuffix, ' on @audius! #AudiusTrending #Audius')

      return {
        message: 'Share this Milestone',
        href: 'http://twitter.com/share?url='
          .concat(encodeURIComponent(_url2), '&text=')
          .concat(encodeURIComponent(_text2))
      }
    }

    case _constants.notificationTypes.ChallengeReward: {
      const _text3 =
        'I earned $AUDIO for completing challenges on @audius #AudioRewards'
      return {
        message: 'Share this with your fans',
        href: 'http://twitter.com/share?text='.concat(
          encodeURIComponent(_text3)
        )
      }
    }

    default:
      return null
  }
}

const Notification = function Notification(props) {
  const message = getMessage(props)
  const title = getTitle(props)
  const trackMessage = getTrackMessage(props)
  const twitter = getTwitter(props)
  return /* #__PURE__ */ _react.default.createElement(
    _NotificationBody.default,
    _extends({}, props, {
      title: title,
      message: message,
      trackMessage: trackMessage,
      twitter: twitter
    })
  )
}

const _default = Notification
exports.default = _default
