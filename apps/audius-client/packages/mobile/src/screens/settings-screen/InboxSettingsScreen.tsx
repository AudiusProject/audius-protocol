import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import IconMessage from 'app/assets/images/iconMessage.svg'
import { RadioButton, Text, Screen, ScreenContent } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  title: 'Inbox Settings',
  allowAllTitle: 'Allow Messages from Everyone',
  allowAllText:
    'Anyone can send you a direct message, regardless of whether you follow them or not.',
  followsTitle: 'Only Allow Messages From People You Follow',
  followsText: 'Only users that you follow can send you direct messages.',
  supportersTitle: 'Only Allow Messages From Your Supporters',
  supportersText:
    'Only users who have tipped you can send you direct messages.',
  noneTitle: 'No One Can Message You',
  noneText:
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
  }
}))

export const InboxSettingsScreen = () => {
  const styles = useStyles()
  return (
    <Screen
      title={messages.title}
      variant='secondary'
      topbarRight={null}
      icon={IconMessage}
    >
      <View style={styles.shadow} />
      <ScreenContent>
        <ScrollView>
          <View style={styles.settingsRow}>
            <View style={styles.settingsContent}>
              <View style={styles.radioTitleRow}>
                <RadioButton checked={false} style={styles.radio} />
                <Text style={styles.title}>{messages.allowAllTitle}</Text>
              </View>
              <View>
                <Text style={styles.text}>{messages.allowAllText}</Text>
              </View>
            </View>
          </View>
          <View style={styles.settingsRow}>
            <View style={styles.settingsContent}>
              <View style={styles.radioTitleRow}>
                <RadioButton checked={false} style={styles.radio} />
                <Text style={styles.title}>{messages.followsTitle}</Text>
              </View>
              <View>
                <Text style={styles.text}>{messages.followsText}</Text>
              </View>
            </View>
          </View>
          <View style={styles.settingsRow}>
            <View style={styles.settingsContent}>
              <View style={styles.radioTitleRow}>
                <RadioButton checked={false} style={styles.radio} />
                <Text style={styles.title}>{messages.supportersTitle}</Text>
              </View>
              <View>
                <Text style={styles.text}>{messages.supportersText}</Text>
              </View>
            </View>
          </View>
          <View style={styles.settingsRow}>
            <View style={styles.settingsContent}>
              <View style={styles.radioTitleRow}>
                <RadioButton checked={false} style={styles.radio} />
                <Text style={styles.title}>{messages.noneTitle}</Text>
              </View>
              <View>
                <Text style={styles.text}>{messages.noneText}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
