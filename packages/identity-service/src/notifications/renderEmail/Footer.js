'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = void 0

const _react = _interopRequireDefault(require('react'))

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

const iconStyle = {
  height: '24px',
  width: '24px',
  padding: '0px 24px'
}

const InstagramLink = function InstagramLink() {
  return /* #__PURE__ */ _react.default.createElement(
    'a',
    {
      href: 'https://www.instagram.com/audius/'
    },
    /* #__PURE__ */ _react.default.createElement('img', {
      src: 'https://download.audius.co/static-resources/email/iconInsta.png',
      alt: 'instagram',
      style: iconStyle
    })
  )
}

const TwitterLink = function TwitterLink() {
  return /* #__PURE__ */ _react.default.createElement(
    'a',
    {
      href: 'https://twitter.com/audius'
    },
    /* #__PURE__ */ _react.default.createElement('img', {
      src: 'https://download.audius.co/static-resources/email/iconTwitter.png',
      alt: 'twitter',
      style: iconStyle
    })
  )
}

const DiscordLink = function DiscordLink() {
  return /* #__PURE__ */ _react.default.createElement(
    'a',
    {
      href: 'https://discordapp.com/invite/yNUg2e2'
    },
    /* #__PURE__ */ _react.default.createElement('img', {
      src: 'https://download.audius.co/static-resources/email/iconDiscord.png',
      alt: 'discord',
      style: iconStyle
    })
  )
}

const MadeWithLove = function MadeWithLove() {
  return /* #__PURE__ */ _react.default.createElement(
    'div',
    {
      className: 'gilroy',
      style: {
        textAlign: 'center',
        color: '#858199',
        fontSize: '14px'
      }
    },
    'Made with ',
    /* #__PURE__ */ _react.default.createElement(
      'span',
      {
        style: {
          color: '#7E1BCC'
        }
      },
      '\u2665\uFE0E'
    ),
    ' in SF & LA'
  )
}

const AllRightsReserved = function AllRightsReserved(_ref) {
  const copyrightYear = _ref.copyrightYear
  return /* #__PURE__ */ _react.default.createElement(
    'div',
    {
      className: 'gilroy',
      style: {
        textAlign: 'center',
        color: '#858199',
        fontSize: '14px'
      }
    },
    '\xA9 ',
    copyrightYear,
    ' Audius, Inc. All Rights Reserved.'
  )
}

const Unsubscribe = function Unsubscribe() {
  return /* #__PURE__ */ _react.default.createElement(
    'div',
    {
      className: 'gilroy',
      style: {
        textAlign: 'center',
        color: '#858199',
        fontSize: '14px'
      }
    },
    'Tired of seeing these emails? ',
    /* #__PURE__ */ _react.default.createElement(
      'a',
      {
        href: 'https://audius.co/settings',
        class: 'utilityLink',
        style: {
          textDecorationColor: '#858199'
        }
      },
      /* #__PURE__ */ _react.default.createElement(
        'span',
        {
          style: {
            color: '#858199'
          }
        },
        'Update your notification preferences'
      )
    ),
    /* #__PURE__ */ _react.default.createElement('span', {
      class: 'mobileHide'
    })
  )
}

const Footer = function Footer(props) {
  return /* #__PURE__ */ _react.default.createElement(
    'table',
    {
      border: '0',
      cellpadding: '0',
      cellspacing: '0',
      style: {
        margin: '0px auto',
        height: 'auto',
        paddingBotton: '25px'
      }
    },
    /* #__PURE__ */ _react.default.createElement(
      'tr',
      null,
      /* #__PURE__ */ _react.default.createElement(
        'td',
        {
          valign: 'center',
          id: 'socialBar',
          style: {
            textAlign: 'center',
            padding: '25px 0px 20px'
          }
        },
        /* #__PURE__ */ _react.default.createElement(InstagramLink, null),
        /* #__PURE__ */ _react.default.createElement(TwitterLink, null),
        /* #__PURE__ */ _react.default.createElement(DiscordLink, null)
      )
    ),
    /* #__PURE__ */ _react.default.createElement(
      'tr',
      null,
      /* #__PURE__ */ _react.default.createElement(
        'td',
        {
          valign: 'center',
          style: {
            textAlign: 'center',
            padding: '0px 0px 8px',
            margin: '0px'
          }
        },
        /* #__PURE__ */ _react.default.createElement(MadeWithLove, null)
      )
    ),
    /* #__PURE__ */ _react.default.createElement(
      'tr',
      null,
      /* #__PURE__ */ _react.default.createElement(
        'td',
        {
          style: {
            textAlign: 'center',
            verticalAlign: 'center',
            height: 'auto',
            padding: '0px 0px 12px',
            margin: '0px'
          }
        },
        /* #__PURE__ */ _react.default.createElement(AllRightsReserved, {
          copyrightYear: props.copyrightYear
        })
      )
    ),
    /* #__PURE__ */ _react.default.createElement(
      'tr',
      null,
      /* #__PURE__ */ _react.default.createElement(
        'td',
        {
          valign: 'top',
          id: 'utilityBar'
        },
        /* #__PURE__ */ _react.default.createElement(Unsubscribe, null)
      )
    )
  )
}

const _default = Footer
exports.default = _default
