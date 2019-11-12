import React from 'react'

import MultiUserHeader from './MultiUserHeader'

const UserImage = ({ user }) => (
  <img
    src={user.image}
    style={{
      height: '32px',
      width: '32px',
      borderRadius: '50%'
    }}
  />
)

const AnnouncementHeader = () => (
  <>
    <td
      colspan='1'
      valign='center'
      style={{
        padding: '16px 16px 0px 16px'
      }}
    >
      <img
        src={'https://download.audius.co/static-resources/email/iconAnnouncement.svg'}
        style={{
          height: '32px',
          width: '32px',
          borderRadius: '50%',
          display: 'block'
        }}
        alt='Announcement'
        titile='Announcement'
      />
    </td>
    <td
      colspan='11'
      style={{
        width: '100%',
        padding: '16px 0px 0px'
      }}
    >
      <span
        className={'avenir'}
        style={{
          color: '#858199',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {'Announcement'}
      </span>
    </td>
  </>
)

const OpenAudiusLink = () => (
  <a
    className={'avenir'}
    style={{
      width: '337px',
      color: '#C2C0CC',
      fontSize: '12px',
      fontWeight: 600,
      lineHeight: '10px'
    }}
  >
    {'Open Audius'}
    <img
      src='https://download.audius.co/static-resources/email/arrow.svg'
      style={{
        height: '8px',
        width: '8px',
        marginLeft: '4px',
        display: 'inline-block'
      }}
      alt='Arrow Right'
      titile='Arrow Right'
      className='arrowIcon'
    />
  </a>
)

const Favorite = (props) => {
  const hasUsers = Array.isArray(props.users)
  const hasMultiUser = hasUsers && props.users.length > 1

  return (
    <table
      border='0'
      cellpadding='0'
      cellspacing='0'
      style={{
        borderCollapse: 'separate',
        border: '1px solid rgba(133,129,153,0.2)',
        borderColor: 'rgba(133,129,153,0.2)',
        borderRadius: '4px',
        margin: '0px auto 8px',
        height: 'auto',
        width: '100%',
        maxWidth: '396px'
      }}
    >
      {props.type === 'Announcement' && (
        <tr>
          <AnnouncementHeader />
        </tr>
      )}
      {hasMultiUser && (
        <tr>
          <td
            colspan={'12'}
            valign='center'
            style={{
              padding: '16px 16px 0px',
              paddingTop: props.type === 'Announcement' ? '8px' : '16px',
              borderRadius: '4px'
            }}
          >
            <MultiUserHeader users={props.users} />
          </td>
        </tr>
      )}
      <tr>
        {hasUsers && !hasMultiUser && (
          <td
            colspan={'1'}
            valign='center'
            style={{
              padding: '12px 0px 8px 16px',
              width: '60px'
            }}
          >
            <UserImage user={props.users[0]} />
          </td>
        )}
        <td
          colspan={(hasUsers && !hasMultiUser) ? 11 : 12}
          valign='center'
          style={{
            padding: '12px 16px 8px',
            paddingLeft: (hasUsers && !hasMultiUser) ? '12px' : '16px',
            width: '100%'
          }}
        >
          {props.message}
        </td>
      </tr>
      {props.hasReadMore && (
        <tr>
          <td
            colspan={'12'}
            valign='center'
            className={'avenir'}
            style={{
              padding: '0px 16px 14px',
              color: '#7E1BCC',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {'Read More'}
          </td>
        </tr>
      )}
      <tr>
        <td valign='center' colspan={'12'} style={{ padding: '0px 16px 14px' }}>
          <OpenAudiusLink />
        </td>
      </tr>
    </table>
  )
}

export default Favorite
