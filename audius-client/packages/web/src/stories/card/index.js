import React from 'react'

import { storiesOf } from '@storybook/react'

import placeholderArt from 'assets/img/imageBlank2x.png'
import UserCard from 'components/card/UserCard'
import DesktopCard from 'components/card/desktop/Card'
import MobileCard from 'components/card/mobile/Card'

export default () => {
  return storiesOf('Card', module)
    .add('DesktopCard', () => <DesktopCard />)
    .add('MobileCard', () => (
      <MobileCard
        isUser={false}
        cardCoverImageUrl={placeholderArt}
        primaryText={'Suspicious Minds'}
        secondaryText={'Wan Gengxin'}
      />
    ))
    .add('UserCard', () => <UserCard />)
}
