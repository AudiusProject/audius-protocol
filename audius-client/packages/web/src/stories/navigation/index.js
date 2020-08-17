import React from 'react'
import { storiesOf } from '@storybook/react'

import Dropdown from 'components/navigation/Dropdown'
import CascadingMenu from 'components/navigation/CascadingMenu'
import Tabs from 'components/navigation/Tabs'

export default () => {
  return storiesOf('Navigation', module)
    .add('Dropdown', () => {
      return <Dropdown />
    })
    .add('CascadingMenu', () => {
      const style = {
        position: 'relative',
        width: '100px',
        height: '20px',
        background: 'var(--neutral-light-6)'
      }
      return (
        <div style={style}>
          <CascadingMenu />
        </div>
      )
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
