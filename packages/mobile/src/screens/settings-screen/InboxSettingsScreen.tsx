import { useEffect } from 'react'

import { useSetInboxPermissions } from '@audius/common/hooks'
import { ChatPermission } from '@audius/sdk'
import { TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import IconMessage from 'app/assets/images/iconMessage.svg'
import { RadioButton, Text, Screen, ScreenContent } from 'app/components/core'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { makeStyles } from 'app/styles'

const messages = {
  title: 'Inbox Settings',
  allTitle: 'Allow Messages from Everyone',
  allDescription:
    'Anyone can send you a direct message, regardless of whether you follow them or not.',
  followeeTitle: 'Only Allow Messages From People You Follow',
  followeeDescription:
    'Only users that you follow can send you direct messages.',
  tipperTitle: 'Only Allow Messages From Your Supporters',
  tipperDescription:
    'Only users who have tipped you can send you direct messages.',
  noneTitle: 'No One Can Message You',
  noneDescription:
    'No one will be able to send you direct messages. Note that you will still be able to send messages to others.'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    display: 'flex'
  },
  settingsRow: {
    paddingHorizontal: spacing(4),
    backgroundColor: palette.white
  },
  settingsContent: {
    paddingVertical: spacing(8),
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1
  },
  radioTitleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  radio: {
    marginRight: spacing(2)
  },
  title: {
    marginLeft: spacing(4),
    marginRight: spacing(6),
    color: palette.neutral,
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.bold,
    lineHeight: typography.fontSize.large * 1.5
  },
  text: {
    marginLeft: spacing(12),
    marginTop: spacing(2),
    paddingRight: spacing(6),
    color: palette.neutral,
    fontSize: typography.fontSize.large,
    lineHeight: typography.fontSize.large * 1.4
  },
  shadow: {
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 1
  },
  scrollContainer: {
    backgroundColor: palette.white
  }
}))

const options = [
  {
    title: messages.allTitle,
    description: messages.allDescription,
    value: ChatPermission.ALL
  },
  {
    title: messages.followeeTitle,
    description: messages.followeeDescription,
    value: ChatPermission.FOLLOWEES
  },
  {
    title: messages.tipperTitle,
    description: messages.tipperDescription,
    value: ChatPermission.TIPPERS
  },
  {
    title: messages.noneTitle,
    description: messages.noneDescription,
    value: ChatPermission.NONE
  }
]

export const InboxSettingsScreen = () => {
  const styles = useStyles()
  const { setAndSavePermissions, localPermission, doFetchPermissions } =
    useSetInboxPermissions({
      audiusSdk
    })

  useEffect(() => {
    doFetchPermissions()
  }, [doFetchPermissions])

  return (
    <Screen
      title={messages.title}
      variant='secondary'
      topbarRight={null}
      icon={IconMessage}
    >
      <ScreenContent>
        <ScrollView style={styles.scrollContainer}>
          {options.map((opt, index) => (
            <TouchableOpacity
              onPress={() => {
                const newPermission = opt.value as ChatPermission
                setAndSavePermissions(newPermission)
              }}
              key={opt.title}
            >
              <View style={styles.settingsRow}>
                <View
                  style={[
                    styles.settingsContent,
                    // Hide bottom border on last element
                    index === options.length - 1
                      ? { borderBottomWidth: 0 }
                      : null
                  ]}
                >
                  <View style={styles.radioTitleRow}>
                    <RadioButton
                      checked={localPermission === opt.value}
                      style={styles.radio}
                    />
                    <Text style={styles.title}>{opt.title}</Text>
                  </View>
                  <View>
                    <Text style={styles.text}>{opt.description}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
