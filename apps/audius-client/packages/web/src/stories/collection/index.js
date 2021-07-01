import React from 'react'

import { storiesOf } from '@storybook/react'

import CollectionHeader from 'components/collection/desktop/CollectionHeader'

export default () => {
  return storiesOf('Collection', module).add('CollectionHeader', () => (
    <CollectionHeader />
  ))
}
