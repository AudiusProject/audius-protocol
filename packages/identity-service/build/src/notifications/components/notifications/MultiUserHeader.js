"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const utils_1 = require("./utils");
const MAX_USERS = 9;
const MultiUserHeader = ({ users }) => {
    const hasExtra = users.length > MAX_USERS;
    return (<table align='center' border='0' width='100%' cellpadding='0' cellspacing='0' style={{ margin: '0px', padding: '0px' }}>
      <tr>
        <td valign='top' className='headerNotification' height='100%' width='100%' style={{
            padding: '0px 0px 12px 0px',
            borderBottom: '1px solid #F2F2F4'
        }}>
          <table align='center' border='0' cellpadding='0' cellspacing='0' style={{
            margin: '0px',
            padding: '0px'
        }}>
            <tr>

              {users.slice(0, MAX_USERS).map(user => (<td colSpan='1'>
                  <img src={user.image} style={{
                height: '32px',
                width: '32px',
                borderRadius: '50%',
                marginRight: '5px'
            }} alt={user.name} title={user.name}/>
                </td>))}
              {hasExtra && (<td colSpan='1'>
                  <table align='center' border='0' cellpadding='0' cellspacing='0' width='100%' style={{
                margin: '0px',
                padding: '0px',
                height: '34px',
                width: '34px',
                borderCollapse: 'separate',
                borderRadius: '50%',
                border: '1px solid #C2C0CC'
            }}>
                    <tr>
                      <td className={'avenir'} style={{
                textAlign: 'center',
                color: '#AAA7B8',
                fontSize: '11px',
                fontWeight: 'bold'
            }}>
                        {`+${(0, utils_1.formatCount)(users.length - MAX_USERS)}`}
                      </td>
                    </tr>
                  </table>
                </td>)}
            </tr>
          </table>
        </td>
      </tr>
    </table>);
};
exports.default = MultiUserHeader;
