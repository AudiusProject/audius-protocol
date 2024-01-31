import { cacheTracksSelectors, cacheUsersSelectors } from '@audius/common/store'

import { useField } from 'formik'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import type { ContextualMenuProps } from 'app/components/core'
import { Text, ContextualMenu } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { RemixTrackPill } from '../components'
import type { RemixOfField } from '../types'
const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors

const messages = {
  label: 'Remix Settings',
  remixOf: 'Remix Of'
}

const useStyles = makeStyles(({ spacing }) => ({
  valueRoot: {
    marginTop: spacing(4)
  },
  trackPill: {
    marginTop: spacing(2)
  }
}))

type SelectMoodFieldProps = Partial<ContextualMenuProps>

export const RemixSettingsField = (props: SelectMoodFieldProps) => {
  const styles = useStyles()
  const [{ value: remixOf }] = useField<RemixOfField>('remix_of')
  const [{ value: remixesVisible }] = useField<boolean>(
    'field_visibility.remixes'
  )

  const parentTrackId = remixOf?.tracks[0].parent_track_id

  const parentTrack = useSelector((state) =>
    getTrack(state, { id: parentTrackId })
  )

  const parentTrackUser = useSelector((state) =>
    getUser(state, { id: parentTrack?.owner_id })
  )

  const value = {
    remixOf,
    remixesVisible
  }

  const renderValue = () => {
    return remixOf && parentTrack && parentTrackUser ? (
      <View style={styles.valueRoot}>
        <Text fontSize='small' weight='demiBold'>
          {messages.remixOf}:
        </Text>
        <RemixTrackPill
          style={styles.trackPill}
          track={parentTrack}
          user={parentTrackUser}
        />
      </View>
    ) : null
  }

  return (
    <ContextualMenu
      menuScreenName='RemixSettings'
      label={messages.label}
      value={value}
      renderValue={renderValue}
      {...props}
    />
  )
}
