import React from 'react'
import { storiesOf } from '@storybook/react'

import Dropdown from 'components/navigation/Dropdown'
import Tabs from 'components/navigation/Tabs'

export default () => {
  return storiesOf('Navigation', module)
    .add('Dropdown', () => {
      return <Dropdown />
    })
    .add('Tabs', () => (
      <Tabs
        headers={[
          { icon: null, text: 'TAB 1' },
          { icon: null, text: 'TAB 2' }
        ]}
      >
        <p>content 1</p>
        <p>content 2</p>
      </Tabs>
    ))
}
