import React from 'react'

import { ScrollView, Screen, ScreenContent } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { USDCCard } from './USDCCard'

const messages = {
  title: 'PAYMENTs & EARNINGS'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(3)
  }
}))

export const PayAndEarnScreen = () => {
  const styles = useStyles()
  return (
    <Screen
      url='/payments'
      variant='secondary'
      title={messages.title}
      style={styles.root}
    >
      <ScreenContent>
        <ScrollView>
          <USDCCard />
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
