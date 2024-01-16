import { useCallback, useRef, useState } from 'react'

import { type ID, DownloadQuality } from '@audius/common'
import { Animated, View } from 'react-native'

import { IconReceive, IconCaretDown } from '@audius/harmony-native'
import { Button, SegmentedControl, Text } from 'app/components/core'
import { Expandable, useExpandable } from 'app/components/expandable'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  title: 'Stems & Downloads',
  choose: 'Choose File Quality',
  mp3: 'MP3',
  original: 'Original',
  downloadAll: 'Download All'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: spacing(2),
    marginBottom: spacing(2)
  },
  titleContainer: {
    padding: spacing(4),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleContainerInner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2)
  },
  title: {
    letterSpacing: 0.5
  },
  qualityContainer: {
    padding: spacing(4),
    display: 'flex',
    flexDirection: 'column',
    borderTopWidth: 1,
    borderColor: palette.borderDefault,
    gap: spacing(4),
    alignItems: 'flex-start'
  },
  downloadAll: {
    alignSelf: 'flex-start'
  }
}))

export const DownloadSection = ({ trackId }: { trackId: ID }) => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const [quality, setQuality] = useState(DownloadQuality.MP3)
  const { isExpanded, setIsExpanded, springToValue } = useExpandable()
  const rotateAnim = useRef(new Animated.Value(0))

  const onExpand = useCallback(() => {
    springToValue({
      animation: rotateAnim.current,
      value: isExpanded ? 0 : 180
    })
  }, [springToValue, isExpanded])

  const renderHeader = () => {
    return (
      <View style={styles.titleContainer}>
        <View style={styles.titleContainerInner}>
          <IconReceive fill={neutral} />
          <Text
            fontSize='medium'
            weight='heavy'
            textTransform='uppercase'
            style={styles.title}
          >
            {messages.title}
          </Text>
        </View>
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotateAnim.current.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['0deg', '-180deg']
                })
              }
            ]
          }}
        >
          <IconCaretDown
            width={spacing(4)}
            height={spacing(4)}
            fill={neutral}
          />
        </Animated.View>
      </View>
    )
  }

  const options = [
    {
      key: DownloadQuality.MP3,
      text: messages.mp3
    },
    {
      key: DownloadQuality.ORIGINAL,
      text: messages.original
    }
  ]

  return (
    <View style={styles.root}>
      <Expandable
        renderHeader={renderHeader}
        setIsExpanded={setIsExpanded}
        isExpanded={isExpanded}
        onExpand={onExpand}
      >
        <View style={styles.qualityContainer}>
          <Text>{messages.choose}</Text>
          <SegmentedControl
            options={options}
            selected={quality}
            onSelectOption={(quality) => setQuality(quality)}
          />
          <Button
            title={messages.downloadAll}
            variant='common'
            icon={IconReceive}
            iconPosition='left'
            IconProps={{ width: spacing(4), height: spacing(4) }}
            size='small'
            style={styles.downloadAll}
          />
        </View>
      </Expandable>
    </View>
  )
}
