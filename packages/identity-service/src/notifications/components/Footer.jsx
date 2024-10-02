import React from 'react'

const iconStyle = {
  height: '24px',
  width: '24px',
  padding: '0px 24px'
}

const InstagramLink = () => (
  <a href='https://www.instagram.com/audius/'>
    <img
      src='https://download.audius.co/static-resources/email/iconInsta.png'
      alt='instagram'
      style={iconStyle}
    />
  </a>
)

const TwitterLink = () => (
  <a href='https://twitter.com/audius'>
    <img
      src='https://download.audius.co/static-resources/email/iconTwitter.png'
      alt='twitter'
      style={iconStyle}
    />
  </a>
)

const DiscordLink = () => (
  <a href='https://discordapp.com/invite/yNUg2e2'>
    <img
      src='https://download.audius.co/static-resources/email/iconDiscord.png'
      alt='discord'
      style={iconStyle}
    />
  </a>
)

const MadeWithLove = () => (
  <div
    className={'gilroy'}
    style={{
      textAlign: 'center',
      color: '#858199',
      fontSize: '14px'
    }}>
    Made with <span style={{ color: '#7E1BCC' }}>♥︎</span> in SF & LA
  </div>
)

const AllRightsReserved = ({ copyrightYear }) => (
  <div
    className={'gilroy'}
    style={{
      textAlign: 'center',
      color: '#858199',
      fontSize: '14px'
    }}>
    &copy; {copyrightYear} Audius, Inc. All Rights Reserved.
  </div>
)

const Unsubscribe = () => (
  <div
    className={'gilroy'}
    style={{
      textAlign: 'center',
      color: '#858199',
      fontSize: '14px'
    }}>
    {'Tired of seeing these emails? '}
    <a
      href='https://audius.co/settings'
      class='utilityLink'
      style={{ textDecorationColor: '#858199' }}>
      <span style={{ color: '#858199' }}>
        {'Update your notification preferences'}
      </span>
    </a>
    <span class='mobileHide' />
  </div>
)

const Footer = (props) => {
  return (
    <table
      border='0'
      cellpadding='0'
      cellspacing='0'
      style={{ margin: '0px auto', height: 'auto', paddingBotton: '25px' }}>
      <tr>
        <td
          valign='center'
          id='socialBar'
          style={{ textAlign: 'center', padding: '25px 0px 20px' }}>
          <InstagramLink />
          <TwitterLink />
          <DiscordLink />
        </td>
      </tr>
      <tr>
        <td
          valign='center'
          style={{
            textAlign: 'center',
            padding: '0px 0px 8px',
            margin: '0px'
          }}>
          <MadeWithLove />
        </td>
      </tr>
      <tr>
        <td
          style={{
            textAlign: 'center',
            verticalAlign: 'center',
            height: 'auto',
            padding: '0px 0px 12px',
            margin: '0px'
          }}>
          <AllRightsReserved copyrightYear={props.copyrightYear} />
        </td>
      </tr>
      <tr>
        <td valign='top' id='utilityBar'>
          <Unsubscribe />
        </td>
      </tr>
    </table>
  )
}

export default Footer
