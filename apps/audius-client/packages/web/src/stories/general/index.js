import React from 'react'
import { storiesOf } from '@storybook/react'

import FollowButton from 'components/general/FollowButton'
import BackButton from 'components/general/BackButton'
import Pill from 'components/general/Pill'
import Header from 'components/general/header/desktop/Header'
import Stats from 'components/general/Stats'
import More from 'components/general/More'
import CoverPhoto from 'components/general/CoverPhoto'
import StatBanner from 'components/general/StatBanner'
import NavBanner from 'components/general/NavBanner'
import Mask from 'components/general/Mask'
import ConfirmationBox from 'components/general/ConfirmationBox'
import Toast from 'components/toast/Toast'

export default () => {
  return storiesOf('General', module)
    .add('FollowButton', () => <FollowButton />)
    .add('BackButton', () => <BackButton />)
    .add('Pill', () => <Pill />)
    .add('Header', () => {
      return <Header primary={'Morty Smith'} />
    })
    .add('More', () => <More />)
    .add('Stats', () => <Stats />)
    .add('CoverPhoto', () => <CoverPhoto />)
    .add('StatBanner', () => <StatBanner />)
    .add('NavBanner', () => <NavBanner />)
    .add('Mask', () => (
      <Mask>
        <h1>Yo!</h1>
        <p>Check out this amazing content that you can hide</p>
        <button>Click me!</button>
      </Mask>
    ))
    .add('ConfirmationBox', () => <ConfirmationBox />)
    .add('Toast', () => (
      <Toast
        text={'Reposted!'}
        containerStyles={{
          width: '200px',
          height: '100px',
          border: '1px solid black'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {' '}
          Click Me!
        </div>
      </Toast>
    ))
}
