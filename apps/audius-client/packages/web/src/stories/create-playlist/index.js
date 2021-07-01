import React from 'react'

import { storiesOf } from '@storybook/react'

import CreatePlaylistButton from 'components/create-playlist/CreatePlaylistButton'
import CreatePlaylistModal from 'components/create-playlist/CreatePlaylistModal'

export default () => {
  return storiesOf('CreatePlaylist', module)
    .add('CreatePlaylistButton', () => <CreatePlaylistButton />)
    .add('CreatePlaylistModal', () => <CreatePlaylistModal />)
}
