import { route } from '@audius/common/utils'
import {
  IconComponent,
  IconNote,
  IconUser,
  IconUserFollow
} from '@audius/harmony'
import { useMatch } from 'react-router-dom'

import { SteppedProgress } from 'components/stepped-progress/SteppedProgress'

const {
  SIGN_UP_ARTISTS_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE
} = route

type ProgressHeaderStep = 'customize' | 'genres' | 'artists'

const messages = {
  customize: 'Customize',
  genres: 'Genres',
  artists: 'Artists'
}

const STEPS: {
  key: ProgressHeaderStep
  label: string
  icon: IconComponent
}[] = [
  { key: 'customize', label: messages.customize, icon: IconUser },
  { key: 'genres', label: messages.genres, icon: IconNote },
  { key: 'artists', label: messages.artists, icon: IconUserFollow }
]

export const ProgressHeader = () => {
  const matchHandle = useMatch(SIGN_UP_HANDLE_PAGE)
  const matchFinishProfile = useMatch(SIGN_UP_FINISH_PROFILE_PAGE)
  const matchGenres = useMatch(SIGN_UP_GENRES_PAGE)
  const matchArtists = useMatch(SIGN_UP_ARTISTS_PAGE)

  let activeStep: ProgressHeaderStep
  if (matchHandle || matchFinishProfile) {
    activeStep = 'customize'
  } else if (matchGenres) {
    activeStep = 'genres'
  } else if (matchArtists) {
    activeStep = 'artists'
  } else {
    activeStep = 'customize'
  }

  return <SteppedProgress steps={STEPS} activeStep={activeStep} />
}
