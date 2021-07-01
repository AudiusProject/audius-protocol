import React from 'react'

import { storiesOf } from '@storybook/react'

import ArtistCard from 'components/artist/ArtistCard'
import ArtistChip from 'components/artist/ArtistChip'
import UserListModal from 'components/artist/UserListModal'

export default () => {
  return storiesOf('Artist', module)
    .add('Artist Card', () => <ArtistCard userId={1} />)
    .add('Artist Chip', () => <ArtistChip />)
    .add('UserListModal', () => <UserListModal />)
}
