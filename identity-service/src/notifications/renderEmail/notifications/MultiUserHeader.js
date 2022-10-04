'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = void 0

const _react = _interopRequireDefault(require('react'))

const _utils = require('./utils')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

const MAX_USERS = 9

const MultiUserHeader = function MultiUserHeader(_ref) {
  const users = _ref.users
  const hasExtra = users.length > MAX_USERS
  return /* #__PURE__ */ _react.default.createElement(
    'table',
    {
      align: 'center',
      border: '0',
      width: '100%',
      cellpadding: '0',
      cellspacing: '0',
      style: {
        margin: '0px',
        padding: '0px'
      }
    },
    /* #__PURE__ */ _react.default.createElement(
      'tr',
      null,
      /* #__PURE__ */ _react.default.createElement(
        'td',
        {
          valign: 'top',
          className: 'headerNotification',
          height: '100%',
          width: '100%',
          style: {
            padding: '0px 0px 12px 0px',
            borderBottom: '1px solid #F2F2F4'
          }
        },
        /* #__PURE__ */ _react.default.createElement(
          'table',
          {
            align: 'center',
            border: '0',
            cellpadding: '0',
            cellspacing: '0',
            style: {
              margin: '0px',
              padding: '0px'
            }
          },
          /* #__PURE__ */ _react.default.createElement(
            'tr',
            null,
            users.slice(0, MAX_USERS).map(function (user) {
              return /* #__PURE__ */ _react.default.createElement(
                'td',
                {
                  colSpan: '1'
                },
                /* #__PURE__ */ _react.default.createElement('img', {
                  src: user.image,
                  style: {
                    height: '32px',
                    width: '32px',
                    borderRadius: '50%',
                    marginRight: '5px'
                  },
                  alt: user.name,
                  title: user.name
                })
              )
            }),
            hasExtra &&
              /* #__PURE__ */ _react.default.createElement(
                'td',
                {
                  colSpan: '1'
                },
                /* #__PURE__ */ _react.default.createElement(
                  'table',
                  {
                    align: 'center',
                    border: '0',
                    cellpadding: '0',
                    cellspacing: '0',
                    width: '100%',
                    style: {
                      margin: '0px',
                      padding: '0px',
                      height: '34px',
                      width: '34px',
                      borderCollapse: 'separate',
                      borderRadius: '50%',
                      border: '1px solid #C2C0CC'
                    }
                  },
                  /* #__PURE__ */ _react.default.createElement(
                    'tr',
                    null,
                    /* #__PURE__ */ _react.default.createElement(
                      'td',
                      {
                        className: 'avenir',
                        style: {
                          textAlign: 'center',
                          color: '#AAA7B8',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }
                      },
                      '+'.concat(
                        (0, _utils.formatCount)(users.length - MAX_USERS)
                      )
                    )
                  )
                )
              )
          )
        )
      )
    )
  )
}

const _default = MultiUserHeader
exports.default = _default
