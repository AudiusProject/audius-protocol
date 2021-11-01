import React from 'react'

import { StyleSheet, View } from 'react-native'

import { formatDateWithTimezoneOffset } from 'audius-client/src/common/utils/timeUtil'

import Text from '../../components/text'
import { ThemeColors, useThemedStyles } from '../../hooks/useThemedStyles'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    dateWrapper: {
      display: 'flex',
      flexDirection: 'row',
      marginTop: 8,
      marginBottom: 20
    },

    dateTitle: {
      color: themeColors.neutralLight4
    },

    date: {
      color: themeColors.neutralLight2,
      marginRight: 8,
      marginLeft: 8
    }
  })

export const CollectibleDate = ({
  date,
  label
}: {
  date: string
  label: string
}) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.dateWrapper}>
      <Text style={styles.dateTitle} weight='bold'>
        {label}
      </Text>
      <Text style={styles.date}>{formatDateWithTimezoneOffset(date)}</Text>
    </View>
  )
}
