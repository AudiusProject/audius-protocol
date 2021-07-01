import React from 'react'

import { storiesOf } from '@storybook/react'

import ImageSelectionButton from 'components/image-selection/ImageSelectionButton'
import ImageSelectionPopup from 'components/image-selection/ImageSelectionPopup'

export default () => {
  return storiesOf('ImageSelection', module)
    .add('ImageSelectionButton', () => <ImageSelectionButton />)
    .add('ImageSelectionPopup', () => <ImageSelectionPopup />)
}
