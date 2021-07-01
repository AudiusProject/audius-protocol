import React from 'react'

import { storiesOf } from '@storybook/react'

import PlayButton from 'components/play-bar/PlayButton'
import TrackingBar from 'components/play-bar/TrackingBar'
import VolumeBar from 'components/play-bar/VolumeBar'
import NextButton from 'components/play-bar/next-button/NextButton'
import PreviousButton from 'components/play-bar/previous-button/PreviousButton'
import RepeatButton from 'components/play-bar/repeat-button/RepeatButton'
import ShuffleButton from 'components/play-bar/shuffle-button/ShuffleButton'

export default () => {
  return storiesOf('PlayBar', module)
    .add('PlayButton', () => <PlayButton />)
    .add('NextButton', () => <NextButton />)
    .add('PreviousButton', () => <PreviousButton />)
    .add('RepeatButton', () => <RepeatButton />)
    .add('ShuffleButton', () => <ShuffleButton />)
    .add('VolumeBar', () => <VolumeBar />)
    .add('TrackingBar', () => <TrackingBar />)
}
