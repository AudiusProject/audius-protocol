import { usePremiumTracks } from '@audius/common/src/api/tan-query/usePremiumTracks'
import { premiumTracksPageLineupActions } from '@audius/common/store'

import EndOfLineup from 'components/lineup/EndOfLineup'
import Lineup from 'components/lineup/Lineup'
import { useTanQueryLineupProps } from 'components/lineup/hooks'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import { PremiumTracksPageContent as DesktopPremiumTracksPageContent } from './desktop/PremiumTracksPageContent'
import { PremiumTracksPageContent as MobilePremiumTracksPageContent } from './mobile/PremiumTracksPageContent'

const messages = {
  endOfLineupDescription: "Looks like you've reached the end of this list..."
}

export const PremiumTracksPage = () => {
  const ref = useMainContentRef()
  const { lineup, loadNextPage, play, pause, isPlaying, pageSize } =
    usePremiumTracks()
  const lineupProps = useTanQueryLineupProps()
  const isMobile = useIsMobile()
  const Content = isMobile
    ? MobilePremiumTracksPageContent
    : DesktopPremiumTracksPageContent

  const renderLineup = () => {
    return (
      <Lineup
        actions={premiumTracksPageLineupActions}
        scrollParent={ref.current}
        endOfLineup={
          <EndOfLineup description={messages.endOfLineupDescription} />
        }
        lineup={lineup}
        loadMore={loadNextPage}
        playTrack={play}
        pauseTrack={pause}
        playing={isPlaying}
        pageSize={pageSize}
        {...lineupProps}
      />
    )
  }
  return <Content lineup={renderLineup()} />
}
