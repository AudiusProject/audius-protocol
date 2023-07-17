import { ChangeEvent, useCallback, useMemo } from 'react'

import {
  accountSelectors,
  collectiblesSelectors,
  FeatureFlags,
  FieldVisibility,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  Nullable,
  PremiumConditions,
  TrackAvailabilityType
} from '@audius/common'
import {
  IconCollectible,
  IconHidden,
  IconSpecialAccess,
  IconVisibilityPublic,
  RadioButtonGroup
} from '@audius/stems'
import { Formik, useField } from 'formik'
import { get, isEmpty, set, isEqual, omit } from 'lodash'
import { useSelector } from 'react-redux'

import { HelpCallout } from 'components/help-callout/HelpCallout'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useFlag } from 'hooks/useRemoteConfig'
import { defaultFieldVisibility } from 'pages/track-page/utils'

import { EditFormValues } from '../components/EditPageNew'
import { ModalField } from '../fields/ModalField'
import {
  defaultHiddenFields,
  HiddenAvailabilityFields
} from '../fields/availability/HiddenAvailabilityFields'
import {
  SpecialAccessFields,
  SpecialAccessType
} from '../fields/availability/SpecialAccessFields'
import { CollectibleGatedDescription } from '../fields/availability/collectible-gated/CollectibleGatedDescription'
import { CollectibleGatedFields } from '../fields/availability/collectible-gated/CollectibleGatedFields'

import { REMIX_OF } from './RemixModalForm'
import styles from './TrackAvailabilityModalForm.module.css'
const { getSupportedUserCollections } = collectiblesSelectors
const { getUserId } = accountSelectors

const messages = {
  title: 'Availability',
  description:
    "Customize your music's availability for different audiences, and create personalized gated experiences for your fans.",
  isRemix:
    'This track is marked as a remix. To enable additional availability options, unmark within Remix Settings.',
  done: 'Done',
  public: 'Public (Default)',
  publicSubtitle:
    'Public tracks are visible to all users and appear throughout Audius.',
  specialAccess: 'Special Access',
  specialAccessSubtitle:
    'Special Access tracks are only available to users who meet certain criteria, such as following the artist.',
  collectibleGated: 'Collectible Gated',
  collectibleGatedSubtitle:
    'Users who own a digital collectible matching your selection will have access to your track. Collectible gated content does not appear on trending or in user feeds.',
  noCollectibles:
    'No Collectibles found. To enable this option, link a wallet containing a collectible.',
  compatibilityTitle: "Not seeing what you're looking for?",
  compatibilitySubtitle:
    'Unverified Solana NFT Collections are not compatible at this time.',
  hidden: 'Hidden',
  hiddenSubtitle:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  learnMore: 'Learn More'
}

const IS_UNLISTED = 'is_unlisted'
const IS_PREMIUM = 'is_premium'
export const PREMIUM_CONDITIONS = 'premium_conditions'

export const AVAILABILITY_TYPE = 'availability_type'
const SPECIAL_ACCESS_TYPE = 'special_access_type'
export const FIELD_VISIBILITY = 'field_visibility'

export type TrackAvailabilityFormValues = {
  [AVAILABILITY_TYPE]: TrackAvailabilityType
  [PREMIUM_CONDITIONS]: Nullable<PremiumConditions>
  [SPECIAL_ACCESS_TYPE]: Nullable<SpecialAccessType>
  [FIELD_VISIBILITY]: Nullable<FieldVisibility>
}

/**
 * A modal that allows you to set a track as collectible-gated, special access, or unlisted,
 * as well as toggle individual unlisted metadata field visibility.
 */
export const TrackAvailabilityModalForm = () => {
  // Fields from the outer form
  const [{ value: isUnlistedValue }, , { setValue: setIsUnlistedValue }] =
    useField<EditFormValues[typeof IS_UNLISTED]>(IS_UNLISTED)
  const [{ value: isPremiumValue }, , { setValue: setIsPremiumValue }] =
    useField<EditFormValues[typeof IS_PREMIUM]>(IS_PREMIUM)
  const [
    { value: premiumConditionsValue },
    ,
    { setValue: setPremiumConditionsValue }
  ] = useField<EditFormValues[typeof PREMIUM_CONDITIONS]>(PREMIUM_CONDITIONS)
  const [
    { value: fieldVisibilityValue },
    ,
    { setValue: setFieldVisibilityValue }
  ] = useField<EditFormValues[typeof FIELD_VISIBILITY]>(FIELD_VISIBILITY)
  const [{ value: remixOfValue }] =
    useField<EditFormValues[typeof REMIX_OF]>(REMIX_OF)
  const isRemix = !isEmpty(remixOfValue?.tracks)

  const initialValues = useMemo(() => {
    const isTipGated = isPremiumContentTipGated(premiumConditionsValue)
    const isFollowGated = isPremiumContentFollowGated(premiumConditionsValue)
    const isCollectibleGated = isPremiumContentCollectibleGated(
      premiumConditionsValue
    )
    const initialValues = {}
    set(initialValues, IS_UNLISTED, isUnlistedValue)
    set(initialValues, IS_PREMIUM, isPremiumValue)
    set(initialValues, PREMIUM_CONDITIONS, premiumConditionsValue)

    let availabilityType = TrackAvailabilityType.PUBLIC
    if (isFollowGated || isTipGated) {
      availabilityType = TrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isCollectibleGated) {
      availabilityType = TrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (
      // Remixes has its own toggle field so should not affect the selected availability type
      !isEqual(omit(fieldVisibilityValue, 'remixes'), defaultHiddenFields)
    ) {
      availabilityType = TrackAvailabilityType.HIDDEN
    }
    // TODO: USDC gated type
    set(initialValues, AVAILABILITY_TYPE, availabilityType)

    set(initialValues, FIELD_VISIBILITY, fieldVisibilityValue)
    set(
      initialValues,
      SPECIAL_ACCESS_TYPE,
      isTipGated ? SpecialAccessType.TIP : SpecialAccessType.FOLLOW
    )
    return initialValues as TrackAvailabilityFormValues
  }, [
    fieldVisibilityValue,
    isPremiumValue,
    isUnlistedValue,
    premiumConditionsValue
  ])

  const onSubmit = useCallback(
    (values: TrackAvailabilityFormValues) => {
      setPremiumConditionsValue(get(values, PREMIUM_CONDITIONS))
      if (values[PREMIUM_CONDITIONS]) {
        setIsPremiumValue(true)
      }
      setFieldVisibilityValue(get(values, FIELD_VISIBILITY) ?? undefined)
      if (values[AVAILABILITY_TYPE] === TrackAvailabilityType.HIDDEN) {
        setIsUnlistedValue(true)
      } else {
        setFieldVisibilityValue(defaultFieldVisibility)
      }
    },
    [
      setFieldVisibilityValue,
      setIsPremiumValue,
      setIsUnlistedValue,
      setPremiumConditionsValue
    ]
  )

  const preview = (
    <div className={styles.preview}>
      <div className={styles.header}>
        <label className={styles.title}>{messages.title}</label>
      </div>
      <div className={styles.description}>{messages.description}</div>
      {/* TODO: Rich preview display */}
    </div>
  )

  return (
    <Formik<TrackAvailabilityFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      enableReinitialize
    >
      <ModalField
        title={messages.title}
        icon={<IconHidden className={styles.titleIcon} />}
        preview={preview}
      >
        <TrackAvailabilityFields
          isRemix={isRemix}
          premiumConditions={premiumConditionsValue}
        />
      </ModalField>
    </Formik>
  )
}

type TrackAvailabilityFieldsProps = {
  premiumConditions: EditFormValues[typeof PREMIUM_CONDITIONS]
  isRemix: boolean
}

const TrackAvailabilityFields = (props: TrackAvailabilityFieldsProps) => {
  const { isRemix } = props
  const accountUserId = useSelector(getUserId)
  const { isEnabled: isCollectibleGatedEnabled } = useFlag(
    FeatureFlags.COLLECTIBLE_GATED_ENABLED
  )
  const { isEnabled: isSpecialAccessEnabled } = useFlag(
    FeatureFlags.SPECIAL_ACCESS_ENABLED
  )
  const [
    { value: premiumConditionsValue },
    ,
    { setValue: setPremiumConditionsValue }
  ] =
    useField<TrackAvailabilityFormValues[typeof PREMIUM_CONDITIONS]>(
      PREMIUM_CONDITIONS
    )
  const [
    { value: fieldVisibilityValue },
    ,
    { setValue: setfieldVisibilityValue }
  ] =
    useField<TrackAvailabilityFormValues[typeof FIELD_VISIBILITY]>(
      FIELD_VISIBILITY
    )

  const [availabilityField, , { setValue: setAvailabilityValue }] = useField({
    name: AVAILABILITY_TYPE
  })
  const { ethCollectionMap, solCollectionMap } = useSelector(
    getSupportedUserCollections
  )
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  const hasCollectibles = numEthCollectibles + numSolCollectibles > 0

  const noCollectibleGate = !hasCollectibles
  const noSpecialAccess = isRemix

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const type = e.target.value as TrackAvailabilityType
      switch (type) {
        case TrackAvailabilityType.PUBLIC: {
          setPremiumConditionsValue(null)
          break
        }
        case TrackAvailabilityType.SPECIAL_ACCESS: {
          if (
            !accountUserId ||
            isPremiumContentTipGated(premiumConditionsValue)
          )
            break
          setPremiumConditionsValue({ follow_user_id: accountUserId })
          break
        }
        case TrackAvailabilityType.COLLECTIBLE_GATED:
          if (
            !accountUserId ||
            isPremiumContentCollectibleGated(premiumConditionsValue)
          )
            break
          setPremiumConditionsValue(null)
          break
        case TrackAvailabilityType.HIDDEN:
          if (!fieldVisibilityValue) break
          setfieldVisibilityValue({
            ...fieldVisibilityValue,
            ...defaultHiddenFields
          })
          break
      }
      setAvailabilityValue(type)
    },
    [
      accountUserId,
      fieldVisibilityValue,
      premiumConditionsValue,
      setAvailabilityValue,
      setPremiumConditionsValue,
      setfieldVisibilityValue
    ]
  )

  return (
    <>
      {isRemix ? (
        <HelpCallout className={styles.isRemix} content={messages.isRemix} />
      ) : null}
      <RadioButtonGroup
        defaultValue={TrackAvailabilityType.PUBLIC}
        {...availabilityField}
        onChange={handleChange}
      >
        <ModalRadioItem
          icon={<IconVisibilityPublic className={styles.icon} />}
          label={messages.public}
          description={messages.publicSubtitle}
          value={TrackAvailabilityType.PUBLIC}
        />
        {isSpecialAccessEnabled ? (
          <ModalRadioItem
            icon={<IconSpecialAccess />}
            label={messages.specialAccess}
            description={messages.specialAccessSubtitle}
            value={TrackAvailabilityType.SPECIAL_ACCESS}
            disabled={noSpecialAccess}
            checkedContent={<SpecialAccessFields disabled={noSpecialAccess} />}
          />
        ) : null}
        {isCollectibleGatedEnabled ? (
          <ModalRadioItem
            icon={<IconCollectible />}
            label={messages.collectibleGated}
            value={TrackAvailabilityType.COLLECTIBLE_GATED}
            disabled={noCollectibleGate}
            description={
              <CollectibleGatedDescription
                hasCollectibles={hasCollectibles}
                isUpload={true}
              />
            }
            checkedContent={
              <CollectibleGatedFields disabled={noCollectibleGate} />
            }
          />
        ) : null}
        <ModalRadioItem
          icon={<IconHidden />}
          label={messages.hidden}
          value={TrackAvailabilityType.HIDDEN}
          description={messages.hiddenSubtitle}
          checkedContent={<HiddenAvailabilityFields />}
        />
      </RadioButtonGroup>
    </>
  )
}
