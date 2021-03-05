import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { StyleSheet, FlatList, View, Text, RefreshControl } from 'react-native'
import LottieView from 'lottie-react-native'

import { AppState } from '../../store'
import { getEndReached, getNotifications, getStatus } from '../../store/notifications/selectors'
import NotificationBlock from './NotificationBlock'
import * as notificationsActions from '../../store/notifications/actions'
import { Notification } from '../../store/notifications/types'
import { Status } from '../../types/status'
import Empty from './Empty'
import { useColor } from '../../utils/theme'
import * as haptics from '../../haptics'

const styles = StyleSheet.create({
  list: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
  },
  itemContainer: {
    marginTop: 8,
  },
  footer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48
  }
})

type OwnProps = {
  onLoadMore: () => void
  onRefresh: () => void
  onGoToRoute: (route: string) => void
}

type ListProps =
  OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>


const List = ({
  notifications,
  status,
  setStatus,
  onLoadMore,
  onRefresh,
  onGoToRoute,
  endReached
}: ListProps) => {
  const onEndReached = useCallback(() => {
    if (status !== Status.LOADING && !endReached) {
      setStatus(Status.LOADING)
      onLoadMore()
    }
  }, [status, setStatus, onLoadMore])

  const onPullRefresh = useCallback(() => {
    haptics.light()
    setStatus(Status.LOADING)
    onRefresh()
  }, [setStatus, onRefresh])

  const refreshColor = useColor('neutralLight6')
  const spinnerColor = useColor('neutralLight4')

  const renderPullToRefresh = () => {
    return (
      <RefreshControl
        refreshing={status === Status.LOADING && notifications.length > 0}
        tintColor={refreshColor}
        onRefresh={onPullRefresh}
      />
    )
  }

  if (
    status === Status.SUCCESS &&
    notifications.length === 0
  ) {
    return <Empty />
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{
        paddingBottom: 80
      }}
      refreshControl={renderPullToRefresh()}
      data={notifications}
      keyExtractor={(item: Notification) => `${item.id}`}
      renderItem={({ item }) => (
        <View
          style={styles.itemContainer}
        >
          <NotificationBlock
            notification={item}
            onGoToRoute={onGoToRoute}
          />
        </View>
      )}
      ListFooterComponent={() => (
        status === Status.LOADING && (
          <View
            style={styles.footer}
          >
            <LottieView
              source={require('../../assets/animations/loadingSpinner.json')}
              autoPlay
              loop
              colorFilters={[
                {
                  keypath: 'Shape Layer 1',
                  color: spinnerColor
                },
                {
                  keypath: 'Shape Layer 2',
                  color: spinnerColor
                }
              ]}
            />
          </View>
        )
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
      initialNumToRender={10}
    />
  )
}

const mapStateToProps = (state: AppState) => ({
  notifications: getNotifications(state),
  status: getStatus(state),
  endReached: getEndReached(state)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  setStatus: (status: Status) => dispatch(notificationsActions.setStatus(status))
})

export default connect(mapStateToProps, mapDispatchToProps)(List)
