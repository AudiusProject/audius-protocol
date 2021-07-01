import React from 'react'

import { storiesOf } from '@storybook/react'

import Delineator from 'components/delineator/Delineator'

export default () => {
  return storiesOf('Delineator', module).add('Delineator', () => <Delineator />)
}
