import type { Nullable } from '@audius/common'
import { cacheUsersSelectors, cacheTracksSelectors } from '@audius/common'
import { useField } from 'formik'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import type { ContextualSubmenuProps } from 'app/components/core'
import { Text, ContextualSubmenu } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { RemixTrackPill } from '../components'
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

type SelectMoodFieldProps = Partial<ContextualSubmenuProps>

export const RemixSettingsField = (props: SelectMoodFieldProps) => {
  const styles = useStyles()
  const [{ value: remixOf }] = useField<Nullable<string>>('remix_of')
  const [{ value: remixesVisible }] = useField<boolean>(
    'field_visibility.remixes'
  )

  const parentTrack = useSelector((state) =>
    getTrack(state, { permalink: remixOf ? new URL(remixOf).pathname : null })
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
    <ContextualSubmenu
      submenuScreenName='RemixSettings'
      label={messages.label}
      value={value}
      renderValue={renderValue}
      {...props}
    />
  )
}
