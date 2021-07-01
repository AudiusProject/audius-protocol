import React from 'react'

import { storiesOf } from '@storybook/react'

import Dropzone from 'components/upload/Dropzone'
import PreviewButton from 'components/upload/PreviewButton'
import ProgressBar from 'components/upload/ProgressBar'
import TrackPreview from 'components/upload/TrackPreview'
import UploadArtwork from 'components/upload/UploadArtwork'
import UploadChip from 'components/upload/UploadChip'

export default () => {
  return storiesOf('Upload', module)
    .add('Dropzone', () => <Dropzone />)
    .add('PreviewButton', () => <PreviewButton />)
    .add('TrackPreview', () => <TrackPreview />)
    .add('ProgressBar', () => <ProgressBar />)
    .add('UploadArtwork', () => <UploadArtwork />)
    .add('UploadChip', () => <UploadChip />)
}
