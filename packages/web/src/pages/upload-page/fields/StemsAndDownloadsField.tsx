import { useCallback, useMemo } from 'react'

import { useUSDCPurchaseConfig } from '@audius/common/hooks'
import {
  stemCategoryFriendlyNames,
  isContentFollowGated,
  isContentUSDCPurchaseGated,
  AccessConditions,
  DownloadTrackAvailabilityType,
  FollowGatedConditions,
  StemUpload,
  USDCPurchaseConditions,
  StemCategory
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { IconReceive } from '@audius/harmony'
import { IconCart } from '@audius/stems'
import { FormikErrors } from 'formik'
import { get, set } from 'lodash'
import { useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ContextualMenu,
  SelectedValue,
  SelectedValues
} from 'components/data-entry/ContextualMenu'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'

import { useTrackField } from '../hooks'

import {
  StemsAndDownloadsMenuFields,
  stemsAndDownloadsSchema
} from './StemsAndDownloadsMenuFields'
import { getCombinedDefaultGatedConditionValues } from './helpers'
import {
  IS_DOWNLOAD_GATED,
  DOWNLOAD_CONDITIONS,
  STREAM_CONDITIONS,
  CID,
  DOWNLOAD_AVAILABILITY_TYPE,
  DOWNLOAD_PRICE_HUMANIZED,
  DOWNLOAD_REQUIRES_FOLLOW,
  IS_DOWNLOADABLE,
  IS_ORIGINAL_AVAILABLE,
  STEMS,
  StemsAndDownloadsFormValues,
  LAST_GATE_KEEPER,
  GateKeeper
} from './types'

const { getUserId } = accountSelectors

const messages = {
  title: 'Stems & Downloads',
  description:
    'Upload your track’s source files and customize how fans download your files.',
  values: {
    allowDownload: 'Full Track Available',
    allowOriginal: 'Lossless Files Available',
    followerGated: 'Followers Only'
  },
  price: (price: number) =>
    price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

type StemsAndDownloadsFieldProps = {
  closeMenuCallback?: (data?: any) => void
}

export const StemsAndDownloadsField = ({
  closeMenuCallback
}: StemsAndDownloadsFieldProps) => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )
  const usdcPurchaseConfig = useUSDCPurchaseConfig()

  const [{ value: isDownloadable }, , { setValue: setIsDownloadable }] =
    useTrackField<boolean>(IS_DOWNLOADABLE)
  const [
    { value: isOriginalAvailable },
    ,
    { setValue: setisOriginalAvailable }
  ] = useTrackField<boolean>(IS_ORIGINAL_AVAILABLE)
  const [, , { setValue: setDownloadRequiresFollow }] = useTrackField<boolean>(
    DOWNLOAD_REQUIRES_FOLLOW
  )
  const [{ value: stemsValue }, , { setValue: setStemsValue }] =
    useTrackField<StemUpload[]>(STEMS)
  const [{ value: cid }, , { setValue: setCidValue }] =
    useTrackField<Nullable<string>>(CID)
  const [{ value: isDownloadGated }, , { setValue: setIsDownloadGated }] =
    useTrackField<boolean>(IS_DOWNLOAD_GATED)
  const [
    { value: savedDownloadConditions },
    ,
    { setValue: setDownloadConditions }
  ] = useTrackField<Nullable<AccessConditions>>(DOWNLOAD_CONDITIONS)
  const [{ value: streamConditions }] =
    useTrackField<Nullable<AccessConditions>>(STREAM_CONDITIONS)
  const [{ value: lastGateKeeper }, , { setValue: setLastGateKeeper }] =
    useTrackField<GateKeeper>(LAST_GATE_KEEPER)

  /**
   * Stream conditions from inside the modal.
   * Upon submit, these values along with the selected access option will
   * determine the final stream conditions that get saved to the track.
   */
  const accountUserId = useSelector(getUserId)
  const tempDownloadConditions = useMemo(
    () => ({
      ...getCombinedDefaultGatedConditionValues(accountUserId),
      ...savedDownloadConditions
    }),
    [accountUserId, savedDownloadConditions]
  )

  const initialValues = useMemo(() => {
    const initialValues = {}
    set(initialValues, IS_DOWNLOADABLE, isDownloadable)
    set(initialValues, IS_ORIGINAL_AVAILABLE, isOriginalAvailable)
    set(
      initialValues,
      DOWNLOAD_REQUIRES_FOLLOW,
      isContentFollowGated(savedDownloadConditions)
    )
    set(initialValues, STEMS, stemsValue ?? [])
    set(initialValues, CID, cid ?? null)
    set(initialValues, IS_DOWNLOAD_GATED, isDownloadGated)
    set(initialValues, DOWNLOAD_CONDITIONS, tempDownloadConditions)
    set(initialValues, STREAM_CONDITIONS, streamConditions)
    set(initialValues, LAST_GATE_KEEPER, lastGateKeeper ?? {})

    let availabilityType = DownloadTrackAvailabilityType.PUBLIC
    const isUsdcGated = isContentUSDCPurchaseGated(savedDownloadConditions)
    const isFollowGated = isContentFollowGated(savedDownloadConditions)
    if (isUsdcGated) {
      availabilityType = DownloadTrackAvailabilityType.USDC_PURCHASE
      set(
        initialValues,
        DOWNLOAD_PRICE_HUMANIZED,
        tempDownloadConditions.usdc_purchase.price
          ? (Number(tempDownloadConditions.usdc_purchase.price) / 100).toFixed(
              2
            )
          : undefined
      )
    }
    if (isFollowGated) {
      availabilityType = DownloadTrackAvailabilityType.FOLLOWERS
    }
    set(initialValues, DOWNLOAD_AVAILABILITY_TYPE, availabilityType)
    return initialValues as StemsAndDownloadsFormValues
  }, [
    isDownloadable,
    isOriginalAvailable,
    stemsValue,
    cid,
    isDownloadGated,
    tempDownloadConditions,
    savedDownloadConditions,
    streamConditions,
    lastGateKeeper
  ])

  const handleSubmit = useCallback(
    (values: StemsAndDownloadsFormValues) => {
      const availabilityType = get(values, DOWNLOAD_AVAILABILITY_TYPE)
      const downloadConditions = get(values, DOWNLOAD_CONDITIONS)
      const isDownloadable = get(values, IS_DOWNLOADABLE)
      const downloadRequiresFollow = get(values, DOWNLOAD_REQUIRES_FOLLOW)
      const stems = get(values, STEMS)
      const lastGateKeeper = get(values, LAST_GATE_KEEPER)

      setIsDownloadable(isDownloadable)
      setisOriginalAvailable(get(values, IS_ORIGINAL_AVAILABLE))
      setStemsValue(
        stems.map((stem) => ({
          ...stem,
          category: stem.category ?? StemCategory.OTHER
        }))
      )
      setCidValue(null)

      if (isDownloadable) {
        setLastGateKeeper({
          ...lastGateKeeper,
          downloadable: 'stemsAndDownloads'
        })
      }
      // Note that there is some redundancy with the download fields
      // this will go away once we remove the download object from track
      // and only keep the top level fields.

      if (isLosslessDownloadsEnabled) {
        // If download does not inherit from stream conditions,
        // extract the correct download conditions based on the selected availability type.
        if (!streamConditions) {
          setIsDownloadGated(false)
          setDownloadConditions(null)
          setDownloadRequiresFollow(false)
          switch (availabilityType) {
            case DownloadTrackAvailabilityType.USDC_PURCHASE: {
              setIsDownloadGated(true)
              const {
                usdc_purchase: { price }
              } = downloadConditions as USDCPurchaseConditions
              setDownloadConditions({
                // @ts-ignore fully formed in saga (validated + added splits)
                usdc_purchase: { price: Math.round(price) }
              })
              setLastGateKeeper({
                ...lastGateKeeper,
                access: 'stemsAndDownloads'
              })
              break
            }
            case DownloadTrackAvailabilityType.FOLLOWERS: {
              setIsDownloadGated(true)
              const { follow_user_id } =
                downloadConditions as FollowGatedConditions
              setDownloadConditions({ follow_user_id })
              setDownloadRequiresFollow(true)
              setLastGateKeeper({
                ...lastGateKeeper,
                access: 'stemsAndDownloads'
              })
              break
            }
            case DownloadTrackAvailabilityType.PUBLIC: {
              break
            }
          }
        }
      } else {
        // If download does not inherit from stream conditions,
        // set the download conditions to be follow gated if requires follow switch is on.
        if (!streamConditions) {
          setIsDownloadGated(downloadRequiresFollow)
          setDownloadConditions(
            downloadRequiresFollow
              ? ({
                  follow_user_id: accountUserId
                } as FollowGatedConditions)
              : null
          )
          setDownloadRequiresFollow(downloadRequiresFollow)
          setLastGateKeeper({
            ...lastGateKeeper,
            access: 'stemsAndDownloads'
          })
        }
      }
    },
    [
      isLosslessDownloadsEnabled,
      accountUserId,
      streamConditions,
      setIsDownloadable,
      setDownloadRequiresFollow,
      setisOriginalAvailable,
      setStemsValue,
      setCidValue,
      setIsDownloadGated,
      setDownloadConditions,
      setLastGateKeeper
    ]
  )

  const renderValue = () => {
    let values = []
    if (!streamConditions) {
      if (
        isLosslessDownloadsEnabled &&
        isContentUSDCPurchaseGated(savedDownloadConditions)
      ) {
        values.push({
          label: messages.price(
            savedDownloadConditions.usdc_purchase.price / 100
          ),
          icon: IconCart
        })
      }
      if (isContentFollowGated(savedDownloadConditions)) {
        values.push(messages.values.followerGated)
      }
    }
    if (isDownloadable) {
      values.push(messages.values.allowDownload)
    }
    if (isLosslessDownloadsEnabled && isOriginalAvailable) {
      values.push(messages.values.allowOriginal)
    }
    const stemsCategories =
      stemsValue?.map((stem) =>
        stem.category
          ? stemCategoryFriendlyNames[stem.category]
          : StemCategory.OTHER
      ) ?? []
    values = [...values, ...stemsCategories]

    if (values.length === 0) return null

    return (
      <SelectedValues>
        {values.map((value) => {
          const valueProps =
            typeof value === 'string' ? { label: value } : value
          return <SelectedValue key={valueProps.label} {...valueProps} />
        })}
      </SelectedValues>
    )
  }

  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconReceive />}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      renderValue={renderValue}
      validationSchema={toFormikValidationSchema(
        stemsAndDownloadsSchema(usdcPurchaseConfig)
      )}
      menuFields={<StemsAndDownloadsMenuFields />}
      closeMenuCallback={closeMenuCallback}
      displayMenuErrorMessage={(
        errors: FormikErrors<StemsAndDownloadsFormValues>
      ) => {
        return errors[IS_DOWNLOAD_GATED] ?? null
      }}
    />
  )
}
