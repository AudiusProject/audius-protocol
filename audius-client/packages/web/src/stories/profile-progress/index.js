import React from 'react'

import { storiesOf } from '@storybook/react'

import SegmentedProgressBar from 'components/segmented-progress-bar/SegmentedProgressBar'
import ProfileCompletionTooltip from 'containers//profile-progress/components/ProfileCompletionTooltip'
import ProfileCompletionHeroCard from 'containers/profile-progress/components/ProfileCompletionHeroCard'
import ProfileCompletionPanel from 'containers/profile-progress/components/ProfileCompletionPanel'

export default () => {
  return storiesOf('ProfileProgress', module)
    .add('SegmentedProgressBar Compact', () => (
      <SegmentedProgressBar numSteps={7} isCompact stepsComplete={3} />
    ))
    .add('SegmentedProgressBar Regular', () => (
      <SegmentedProgressBar numSteps={7} stepsComplete={3} />
    ))
    .add('ProfileCompletionPanel', () => (
      <ProfileCompletionPanel
        numSteps={7}
        stepsComplete={3}
        onDismiss={() => ({})}
      />
    ))
    .add('ProfileCompletionHeroCard', () => (
      <ProfileCompletionHeroCard
        completionStages={[
          { title: 'Name & Handle', isCompleted: true },
          { title: 'Profile Picture', isCompleted: true },
          { title: 'Cover Photo', isCompleted: true },
          { title: 'Profile Description', isCompleted: false },
          { title: 'Favorite Track/Playlist', isCompleted: false },
          { title: 'Repost Track/Playlist', isCompleted: false },
          { title: 'Follow Five People', isCompleted: false }
        ]}
        onDismiss={() => ({})}
      />
    ))
    .add('ProfileCompletionTooltip', () => (
      <ProfileCompletionTooltip
        completionStages={[
          { title: 'thing1', isCompleted: true },
          { title: 'thing2', isCompleted: false }
        ]}
      >
        {' '}
        Hover me!{' '}
      </ProfileCompletionTooltip>
    ))
}
