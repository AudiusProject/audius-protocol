import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { sampleSize } from 'lodash'
import {
  setFollowArtistsCategory,
  setFollowedArtists,
  submitFollowedArtists
} from '../../store/signon/actions'
import IconArrow from '../../assets/images/iconArrow.svg'
import IconWand from '../../assets/images/iconWand.svg'
import { useDispatchWeb } from '../../hooks/useDispatchWeb'
import { MessageType } from '../../message/types'
import {
  getAllFollowArtists,
  makeGetFollowArtists
} from '../../store/signon/selectors'
import {
  artistCategories,
  FollowArtistsCategory
} from '../../store/signon/types'
import SignupHeader from './SignupHeader'
import UserImage from '../image/UserImage'
import UserBadges from '../user-badges/UserBadges'
import LinearGradient from 'react-native-linear-gradient'
import { track, make } from '../../utils/analytics'
import { EventNames } from '../../types/analytics'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from './NavigationStack'

const styles = StyleSheet.create({
  container: {
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },
  containerTop: {
    flex: 0,
    position: 'relative',
    top: 0,
    left: 0,
    width: '100%',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderColor: '#DAD9E0'
  },
  cardsArea: {
    flex: 1,
    backgroundColor: '#F2F2F4',
    width: '100%',
    bottom: 0,
    top: 0,
    paddingBottom: 180
  },
  containerCards: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  cardHide: {
    opacity: 0
  },
  cardShow: {
    opacity: 1
  },
  containerButton: {
    position: 'absolute',
    left: 0,
    width: '100%',
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 26,
    bottom: 0,
    zIndex: 15,
    paddingBottom: 40,
    backgroundColor: 'white'
  },
  title: {
    color: '#7E1BCC',
    fontSize: 18,
    fontFamily: 'AvenirNextLTPro-Bold',
    lineHeight: 26,
    textAlign: 'center'
  },
  formBtn: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 8,
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CC0FE0',
    borderRadius: 4,
    paddingRight: 10,
    paddingLeft: 10
  },
  btnDisabled: {
    backgroundColor: '#E7E6EB'
  },
  formButtonTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  formButtonTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'AvenirNextLTPro-Bold'
  },
  icon: {
    height: 20,
    width: 20
  },
  wandBtn: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wandButtonTitle: {
    color: '#858199',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Regular'
  },
  wandIcon: {
    marginRight: 10
  },
  instruction: {
    color: '#858199',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'AvenirNextLTPro-Regular',
    textAlign: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
    paddingLeft: 15,
    paddingRight: 15
  },
  pillsContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  animatedPillView: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    borderRadius: 8,
    borderColor: '#858199',
    borderWidth: 1,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    marginLeft: 8,
    lineHeight: 24
  },
  pillActive: {
    borderColor: '#7E1BCC',
    backgroundColor: '#7E1BCC'
  },
  pillText: {
    fontFamily: 'AvenirNextLTPro-Medium',
    textAlign: 'center',
    fontSize: 14,
    color: '#858199'
  },
  pillTextActive: {
    color: 'white'
  },
  followCounter: {
    color: '#858199',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'AvenirNextLTPro-Regular'
  },
  card: {
    width: 140,
    height: 160,
    borderRadius: 8,
    borderColor: '#6A677A40',
    borderWidth: 0.7,
    backgroundColor: '#FCFCFC',
    color: '#858199',
    marginBottom: 8,
    marginRight: 8,
    marginLeft: 8,
    shadowColor: '#6A677A40',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  cardTextActive: {
    color: 'white'
  },
  cardNameContainer: {
    width: '100%',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingLeft: 8,
    paddingRight: 8
  },
  cardName: {
    color: '#858199',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'AvenirNextLTPro-Bold'
  },
  cardFollowers: {
    color: '#858199',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'AvenirNextLTPro-Regular',
    paddingHorizontal: 8
  },
  cardImage: {
    height: 80,
    width: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#F7F7F9',
    marginBottom: 10
  },
  userImage: {
    borderRadius: 50,
    height: '100%',
    width: '100%',
    marginRight: 12
  }
})

const messages = {
  title: 'Follow At Least 3 Artists To Get Started',
  subTitle:
    'Tracks uploaded or reposted by people you follow will appear in your feed.',
  pickForMe: 'Pick Some For Me',
  following: 'Following',
  continue: 'Continue'
}

const MINIMUM_FOLLOWER_COUNT = 3

const FormTitle = () => {
  const [didAnimation, setDidAnimation] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!didAnimation) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start(() => {
        setDidAnimation(true)
      })
    }
  }, [didAnimation, opacity])

  return (
    <Animated.View style={{ opacity }}>
      <Text style={styles.title}>{messages.title}</Text>
    </Animated.View>
  )
}

const ContinueButton = () => {
  return (
    <View style={styles.formButtonTitleContainer}>
      <Text style={styles.formButtonTitle}>{messages.continue}</Text>
      <IconArrow style={styles.icon} fill='white' />
    </View>
  )
}

const PickForMeButton = () => {
  return (
    <View style={styles.formButtonTitleContainer}>
      <IconWand
        style={styles.wandIcon}
        fill={'#858199'}
        width={16}
        height={16}
      />
      <Text style={styles.wandButtonTitle}>{messages.pickForMe}</Text>
    </View>
  )
}

const FollowArtistCard = ({
  user,
  isSelected
}: {
  user: any
  isSelected: boolean
}) => {
  return (
    <View>
      <LinearGradient
        colors={isSelected ? ['#9849d6', '#6516a3'] : ['white', 'white']}
        style={[styles.card]}
      >
        <View style={styles.cardImage}>
          <UserImage user={user} imageStyle={styles.userImage} />
        </View>
        <UserBadges
          style={styles.cardNameContainer}
          nameStyle={[styles.cardName, isSelected ? styles.cardTextActive : {}]}
          user={user}
        />
        <Text
          style={[
            styles.cardFollowers,
            isSelected ? styles.cardTextActive : {}
          ]}
          numberOfLines={1}
        >
          {user.follower_count} Followers
        </Text>
      </LinearGradient>
    </View>
  )
}

export type FirstFollowsProps = NativeStackScreenProps<
  RootStackParamList,
  'FirstFollows'
>
const FirstFollows = ({ navigation, route }: FirstFollowsProps) => {
  const { email, handle } = route.params
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const getSuggestedFollows = makeGetFollowArtists()
  const suggestedFollowArtists = useSelector(getSuggestedFollows)
  const suggestedFollowArtistsMap = suggestedFollowArtists.reduce(
    (result, user) => ({ ...result, [user.user_id]: user }),
    {}
  )
  const followArtists = useSelector(getAllFollowArtists)
  const {
    categories,
    selectedCategory,
    selectedUserIds: followedArtistIds
  } = followArtists
  const [isDisabled, setIsDisabled] = useState(false)
  const [didFetchArtistsToFollow, setDidFetchArtistsToFollow] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (!didFetchArtistsToFollow) {
      setDidFetchArtistsToFollow(true)
      dispatchWeb({
        type: MessageType.GET_USERS_TO_FOLLOW,
        isAction: true
      })
    }
  }, [didFetchArtistsToFollow, dispatchWeb])

  useEffect(() => {
    setIsDisabled(followedArtistIds.length < MINIMUM_FOLLOWER_COUNT)
  }, [followedArtistIds])

  useEffect(() => {
    setIsTransitioning(false)
  }, [selectedCategory])

  const toggleFollowedArtist = useCallback(
    (userId: number) => {
      const newFollowedArtists = followedArtistIds.includes(userId)
        ? followedArtistIds.filter(id => id !== userId)
        : followedArtistIds.concat([userId])
      dispatch(setFollowedArtists(newFollowedArtists))
    },
    [followedArtistIds, dispatch]
  )

  const addFollowedArtists = useCallback(
    (userIds: number[]) => {
      const newUserIds = userIds.filter(
        userId => !followedArtistIds.includes(userId)
      )
      dispatch(setFollowedArtists(followedArtistIds.concat(newUserIds)))
    },
    [followedArtistIds, dispatch]
  )

  // The autoselect or 'pick for me'
  // Selects the first three aritsts in the current category along with 2 additinal
  // random artist from the top 10
  const onPickForMe = () => {
    const selectedIds = new Set(followedArtistIds)

    const toUnselectedUserIds = (users: any[]) =>
      users
        .map((user: any) => user.user_id)
        .filter((userId: number) => !selectedIds.has(userId))

    const firstThreeUserIds = toUnselectedUserIds(
      suggestedFollowArtists.slice(0, 3)
    )
    const suggestedUserIds = toUnselectedUserIds(
      suggestedFollowArtists.slice(3, 10)
    )

    const followUsers = firstThreeUserIds.concat(
      sampleSize(suggestedUserIds, 2)
    )
    addFollowedArtists(followUsers)
  }

  const Pill = ({
    category,
    setIsTransitioning
  }: {
    category: FollowArtistsCategory
    setIsTransitioning: (value: boolean) => void
  }) => {
    const dispatch = useDispatch()
    const isActive = selectedCategory === category
    const scalePill = new Animated.Value(1)

    const animatePill = (type: 'in' | 'out') => {
      Animated.timing(scalePill, {
        toValue: type === 'in' ? 0.9 : 1,
        duration: 100,
        delay: 0,
        useNativeDriver: true
      }).start()
    }

    const updateSelectedCategory = useCallback(async () => {
      if (!isActive) {
        setIsTransitioning(true)
        dispatch(setFollowArtistsCategory(category))
      }
    }, [isActive, category, setIsTransitioning, dispatch])

    return (
      <Animated.View
        style={[styles.animatedPillView, { transform: [{ scale: scalePill }] }]}
      >
        <TouchableOpacity
          style={[styles.pill, isActive ? styles.pillActive : {}]}
          activeOpacity={1}
          onPressIn={() => animatePill('in')}
          onPressOut={() => animatePill('out')}
          onPress={updateSelectedCategory}
        >
          <Text
            style={[styles.pillText, isActive ? styles.pillTextActive : {}]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const onContinuePress = () => {
    dispatchWeb({
      type: MessageType.SET_FOLLOW_ARTISTS,
      followArtists,
      isAction: true
    })

    dispatch(submitFollowedArtists())

    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_COMPLETE_FOLLOW,
        emailAddress: email,
        handle,
        users: followedArtistIds.join('|'),
        count: followedArtistIds.length
      })
    )

    navigation.push('SignupLoadingPage')
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white' }}>
      <View style={styles.container}>
        <SignupHeader />
        <ScrollView>
          <View style={styles.container}>
            <View style={styles.containerTop}>
              <FormTitle />
              <Text style={styles.instruction}>{messages.subTitle}</Text>
              <View style={styles.pillsContainer}>
                {artistCategories.map(category => (
                  <Pill
                    key={category}
                    category={category}
                    setIsTransitioning={setIsTransitioning}
                  />
                ))}
              </View>
            </View>
            <View style={styles.cardsArea}>
              <TouchableOpacity
                style={styles.wandBtn}
                activeOpacity={0.6}
                onPress={onPickForMe}
              >
                <PickForMeButton />
              </TouchableOpacity>
              <View
                style={[
                  styles.containerCards,
                  isTransitioning ? styles.cardHide : styles.cardShow
                ]}
              >
                {(categories[selectedCategory] || [])
                  .filter(artistId => suggestedFollowArtistsMap[artistId])
                  .map(artistId => (
                    <TouchableOpacity
                      key={`${selectedCategory}-${artistId}`}
                      style={{}}
                      activeOpacity={1}
                      onPress={() => toggleFollowedArtist(artistId)}
                    >
                      <FollowArtistCard
                        user={suggestedFollowArtistsMap[artistId]}
                        isSelected={followedArtistIds.includes(artistId)}
                      />
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.containerButton}>
          <TouchableOpacity
            style={[styles.formBtn, isDisabled ? styles.btnDisabled : {}]}
            activeOpacity={0.6}
            disabled={isDisabled}
            onPress={onContinuePress}
          >
            <ContinueButton />
          </TouchableOpacity>
          <Text style={styles.followCounter}>
            {`${messages.following} ${
              followedArtistIds.length > MINIMUM_FOLLOWER_COUNT
                ? followedArtistIds.length
                : `${followedArtistIds.length}/${MINIMUM_FOLLOWER_COUNT}`
            }`}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default FirstFollows
