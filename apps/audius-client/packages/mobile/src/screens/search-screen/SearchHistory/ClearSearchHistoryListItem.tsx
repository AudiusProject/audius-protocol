import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import { Divider, TextButton } from 'app/components/core'
import { clearHistory } from 'app/store/search/searchSlice'
import { makeStyles } from 'app/styles'

const messages = {
  clear: 'Clear Recent Searches'
}

const useStyles = makeStyles(({ spacing }) => ({
  text: {
    alignSelf: 'center',
    marginTop: spacing(3)
  }
}))

export const ClearSearchHistoryListItem = () => {
  const styles = useStyles()

  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(clearHistory())
  }, [dispatch])

  return (
    <>
      <Divider />
      <TextButton
        title={messages.clear}
        variant='neutralLight4'
        TextProps={{ variant: 'h3', noGutter: true }}
        style={styles.text}
        onPress={handlePress}
      />
    </>
  )
}
