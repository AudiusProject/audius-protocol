import { usePremiumTracks } from '@audius/common/api'
import { premiumTracksPageLineupActions } from '@audius/common/store'

import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { EndOfLineupNotice } from 'app/components/lineup/EndOfLineupNotice'

const messages = {
  header: 'Premium Tracks',
  endOfLineup: 'Check back soon for more premium tracks'
}

export const PremiumTracksScreen = () => {
  const { lineup, loadNextPage, pageSize } = usePremiumTracks()

  return (
    <Screen>
      <ScreenHeader text={messages.header} />
      <ScreenContent>
        <Lineup
          tanQuery
          loadMore={loadNextPage}
          lineup={lineup}
          actions={premiumTracksPageLineupActions}
          pullToRefresh
          ListFooterComponent={
            <EndOfLineupNotice description={messages.endOfLineup} />
          }
          pageSize={pageSize}
        />
      </ScreenContent>
    </Screen>
  )
}
