import { HarmonyButton } from '@audius/stems'
import cn from 'classnames'
import { useField } from 'formik'

import layoutStyles from 'components/layout/layout.module.css'

import { TrackForUpload } from '../components/types'

type MultiTrackSidebarProps = {
  tracks: TrackForUpload[]
}

export const MultiTrackSidebar = (props: MultiTrackSidebarProps) => {
  const { tracks } = props
  const limit = tracks.length
  const [{ value: index }, , { setValue: setIndex }] = useField(
    'trackMetadatasIndex'
  )

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap2)}>
      Track {index + 1} of {limit}
      <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
        <HarmonyButton
          text={'Prev'}
          onClick={() => setIndex(Math.max(index - 1, 0))}
          type='button'
        />
        <HarmonyButton
          text={'Next'}
          onClick={() => setIndex(Math.min(index + 1, limit - 1))}
          type='button'
        />
      </div>
    </div>
  )
}
