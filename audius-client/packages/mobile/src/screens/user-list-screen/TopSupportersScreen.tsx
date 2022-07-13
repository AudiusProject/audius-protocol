import { useCallback } from 'react'

import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { setTopSupporters } from 'audius-client/src/common/store/user-list/top-supporters/actions'
import {
  getUserList,
  getId as getSupportersId
} from 'audius-client/src/common/store/user-list/top-supporters/selectors'
import { View } from 'react-native'

import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { Text } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Top Supporters'
}

const useStyles = makeStyles(({ spacing }) => ({
  titleNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -spacing(3)
  },
  titleName: {
    maxWidth: 120
  }
}))

export const TopSupportersScreen = () => {
  const styles = useStyles()
  const { params } = useRoute<'TopSupporters'>()
  const { userId, source } = params
  const supportersId = useSelectorWeb(getSupportersId)
  const supportersUser = useSelectorWeb((state) =>
    getUser(state, { id: supportersId })
  )
  const dispatchWeb = useDispatchWeb()

  const handleSetSupporters = useCallback(() => {
    dispatchWeb(setTopSupporters(userId))
  }, [dispatchWeb, userId])

  const title =
    source === 'feed' && supportersUser ? (
      <View style={styles.titleNameContainer}>
        <Text variant='h3' style={styles.titleName} numberOfLines={1}>
          {supportersUser.name}
        </Text>
        <Text variant='h3'>&apos;s&nbsp;{messages.title}</Text>
      </View>
    ) : (
      messages.title
    )

  return (
    <UserListScreen title={title} titleIcon={IconTrophy}>
      <UserList
        userSelector={getUserList}
        tag='TOP SUPPORTERS'
        setUserList={handleSetSupporters}
      />
    </UserListScreen>
  )
}
