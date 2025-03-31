import React from 'react'

import MultiUserHeader from './MultiUserHeader'

const UserImage = ({ user }) => (
  <img
    src={user.imageUrl || user.thumbnail}
    style={{
      height: '32px',
      width: '32px',
      borderRadius: '50%'
    }}
  />
)

const TrackImage = ({ track }) => (
  <img
    src={track.imageUrl || track.thumbnail}
    style={{
      height: '42px',
      width: '42px',
      borderRadius: '3px'
    }}
  />
)

const AnnouncementHeader = () => (
  <>
    <td
      colSpan="1"
      valign="center"
      style={{
        padding: '16px 16px 0px 16px'
      }}>
      <img
        src={
          'https://download.audius.co/static-resources/email/announcement.png'
        }
        style={{
          height: '32px',
          width: '32px',
          borderRadius: '50%',
          display: 'block'
        }}
        alt="Announcement"
        titile="Announcement"
      />
    </td>
    <td
      colSpan="11"
      style={{
        width: '100%',
        padding: '16px 0px 0px'
      }}>
      <span
        className={'avenir'}
        style={{
          color: '#858199',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
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
    }}>
    {'Open Audius'}
    <img
      src="https://download.audius.co/static-resources/email/iconArrow.png"
      style={{
        height: '8px',
        width: '8px',
        marginLeft: '4px',
        display: 'inline-block'
      }}
      alt="Arrow Right"
      titile="Arrow Right"
      className="arrowIcon"
    />
  </a>
)

const WrapLink = (props) => {
  return (
    <a
      href="https://audius.co/feed?openNotifications=true"
      style={{ textDecoration: 'none' }}>
      {props.children}
    </a>
  )
}

const Body = (props) => {
  const hasUsers = Array.isArray(props.users)
  const hasMultiUser = hasUsers && props.users.length > 1
  return (
    <table
      border="0"
      cellPadding="0"
      cellSpacing="0"
      style={{
        borderCollapse: 'separate',
        border: '1px solid rgba(133,129,153,0.2)',
        borderColor: 'rgba(133,129,153,0.2)',
        borderRadius: '4px',
        height: 'auto',
        width: '100%',
        maxWidth: '396px',
        marginBottom: '8px'
      }}>
      <tr>
        <td>
          <WrapLink>
            <table
              border="0"
              cellPadding="0"
              cellSpacing="0"
              style={{
                borderCollapse: 'separate',
                height: 'auto',
                width: '100%'
              }}>
              {props.type === 'Announcement' && (
                <tr>
                  <AnnouncementHeader />
                </tr>
              )}
              {props.title && (
                <tr>
                  <td
                    colSpan={'12'}
                    valign="center"
                    style={{
                      padding: '16px 16px 0px',
                      paddingTop: '16px',
                      borderRadius: '4px'
                    }}>
                    {props.title}
                  </td>
                </tr>
              )}
              {hasMultiUser && (
                <tr>
                  <td
                    colSpan={'12'}
                    valign="center"
                    style={{
                      padding: '16px 16px 0px',
                      paddingTop:
                        props.type === 'Announcement' || props.title
                          ? '8px'
                          : '16px',
                      borderRadius: '4px'
                    }}>
                    <MultiUserHeader users={props.users} />
                  </td>
                </tr>
              )}
              <tr>
                {hasUsers && !hasMultiUser && (
                  <td
                    colSpan={'1'}
                    valign="center"
                    style={{
                      padding: '12px 0px 8px 16px',
                      width: '60px'
                    }}>
                    <UserImage user={props.users[0]} />
                  </td>
                )}
                <td
                  colSpan={hasUsers && !hasMultiUser ? 11 : 12}
                  valign="center"
                  style={{
                    padding: '12px 16px 8px',
                    paddingLeft: hasUsers && !hasMultiUser ? '12px' : '16px',
                    paddingTop: props.title
                      ? '8px'
                      : hasUsers && !hasMultiUser
                        ? '12px'
                        : '16px',
                    width: '100%'
                  }}>
                  {props.message}
                </td>
              </tr>
              {props.trackMessage && (
                <tr>
                  <td
                    colSpan={'1'}
                    valign="center"
                    style={{
                      padding: '6px 0px 8px 16px',
                      width: '60px'
                    }}>
                    <TrackImage track={props.track} />
                  </td>
                  <td
                    colSpan={11}
                    valign="center"
                    style={{
                      padding: '6px 16px 8px',
                      paddingLeft: '12px',
                      width: '100%'
                    }}>
                    {props.trackMessage}
                  </td>
                </tr>
              )}
              {props.twitter && (
                <tr>
                  <td
                    colSpan={'12'}
                    style={{
                      padding: '4px 0px 16px 16px',
                      borderRadius: '4px'
                    }}>
                    <a
                      href={props.twitter.href}
                      target="_blank"
                      style={{
                        textDecoration: 'none'
                      }}>
                      <table
                        cellSpacing="0"
                        cellPadding="0"
                        style={{ margin: '0px' }}>
                        <tr>
                          <td
                            style={{
                              borderRadius: '4px',
                              padding: '4px 8px',
                              margin: '0px'
                            }}
                            bgcolor="#1BA1F1">
                            <table
                              cellSpacing="0"
                              cellPadding="0"
                              style={{ margin: '0px' }}>
                              <tr>
                                <td
                                  valign="center"
                                  style={{
                                    margin: '0px'
                                  }}>
                                  <img
                                    src="https://download.audius.co/static-resources/email/iconTwitterWhite.png"
                                    alt="twitter"
                                    style={{
                                      height: '18px',
                                      width: '18px',
                                      padding: '0px',
                                      marginRight: '8px',
                                      verticalAlign: 'text-bottom'
                                    }}
                                  />
                                </td>
                                <td
                                  valign="center"
                                  style={{
                                    margin: '0px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#ffffff',
                                    textDecoration: 'none'
                                  }}>
                                  {props.twitter.message}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              )}
              {props.hasReadMore && (
                <tr>
                  <td
                    colSpan={'12'}
                    valign="center"
                    className={'avenir'}
                    style={{
                      padding: '0px 16px 14px',
                      color: '#7E1BCC',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                    {'Read More'}
                  </td>
                </tr>
              )}
              <tr>
                <td
                  valign="center"
                  colSpan={'12'}
                  style={{ padding: '0px 16px 14px' }}>
                  <OpenAudiusLink />
                </td>
              </tr>
            </table>
          </WrapLink>
        </td>
      </tr>
    </table>
  )
}

export default Body
