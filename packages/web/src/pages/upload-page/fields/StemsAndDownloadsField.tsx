import { useCallback, useMemo } from 'react'

import {
  AccessConditions,
  Download,
  DownloadTrackAvailabilityType,
  FeatureFlags,
  FollowGatedConditions,
  Nullable,
  StemUpload,
  USDCPurchaseConditions,
  accountSelectors,
  stemCategoryFriendlyNames,
  useUSDCPurchaseConfig
} from '@audius/common'
import { get, set } from 'lodash'
import { useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import IconSourceFiles from 'assets/img/iconSourceFiles.svg'
import {
  ContextualMenu,
  SelectedValue,
  SelectedValues
} from 'components/data-entry/ContextualMenu'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'

import { useTrackField } from '../hooks'

import {
  DOWNLOAD_CONDITIONS,
  IS_DOWNLOAD_GATED,
  getCombinedDefaultGatedConditionValues,
  STREAM_CONDITIONS
} from './AccessAndSaleField'
import {
  ALLOW_DOWNLOAD,
  DOWNLOAD_AVAILABILITY_TYPE,
  FOLLOWER_GATED,
  IS_DOWNLOADABLE,
  IS_ORIGINAL_AVAILABLE,
  STEMS,
  StemsAndDownloadsFormValues,
  StemsAndDownloadsMenuFields,
  stemsAndDownloadsSchema
} from './StemsAndDownloadsMenuFields'

const { getUserId } = accountSelectors

const ALLOW_DOWNLOAD_BASE = 'is_downloadable'
const FOLLOWER_GATED_BASE = 'requires_follow'
const CID_BASE = 'cid'
const CID = 'download.cid'

const messages = {
  title: 'Stems & Downloads',
  description:
    'Upload your track’s source files and customize how fans download your files.',
  values: {
    allowDownload: 'Full Track Available',
    allowOriginal: 'Lossless Files Available',
    followerGated: 'Followers Only'
  }
}

export const StemsAndDownloadsField = () => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )
  const usdcPurchaseConfig = useUSDCPurchaseConfig()

  const [{ value: allowDownloadValue }, , { setValue: setAllowDownloadValue }] =
    useTrackField<Download[typeof ALLOW_DOWNLOAD_BASE]>(ALLOW_DOWNLOAD)
  const [{ value: followerGatedValue }, , { setValue: setFollowerGatedValue }] =
    useTrackField<Download[typeof FOLLOWER_GATED_BASE]>(FOLLOWER_GATED)
  const [{ value: cid }, , { setValue: setCidValue }] =
    useTrackField<Download[typeof CID_BASE]>(CID)
  const [{ value: isDownloadable }, , { setValue: setIsDownloadable }] =
    useTrackField<boolean>(IS_DOWNLOADABLE)
  const [
    { value: isOriginalAvailable },
    ,
    { setValue: setisOriginalAvailable }
  ] = useTrackField<boolean>(IS_ORIGINAL_AVAILABLE)
  const [{ value: isDownloadGated }, , { setValue: setIsDownloadGated }] =
    useTrackField<boolean>(IS_DOWNLOAD_GATED)
  const [
    { value: savedDownloadConditions },
    ,
    { setValue: setDownloadConditions }
  ] = useTrackField<Nullable<AccessConditions>>(DOWNLOAD_CONDITIONS)
  const [{ value: streamConditions }] =
    useTrackField<Nullable<AccessConditions>>(STREAM_CONDITIONS)
  const [{ value: stemsValue }, , { setValue: setStemsValue }] =
    useTrackField<StemUpload[]>(STEMS)

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
    set(initialValues, ALLOW_DOWNLOAD, allowDownloadValue ?? false)
    set(initialValues, FOLLOWER_GATED, followerGatedValue ?? false)
    set(initialValues, CID, cid ?? null)
    set(initialValues, STEMS, stemsValue ?? [])
    set(initialValues, IS_DOWNLOADABLE, isDownloadable)
    set(initialValues, IS_ORIGINAL_AVAILABLE, isOriginalAvailable)
    set(initialValues, IS_DOWNLOAD_GATED, isDownloadGated)
    set(initialValues, DOWNLOAD_CONDITIONS, tempDownloadConditions)
    set(initialValues, STREAM_CONDITIONS, streamConditions)
    set(
      initialValues,
      DOWNLOAD_AVAILABILITY_TYPE,
      DownloadTrackAvailabilityType.PUBLIC
    )
    return initialValues as StemsAndDownloadsFormValues
  }, [
    allowDownloadValue,
    followerGatedValue,
    isDownloadable,
    isOriginalAvailable,
    cid,
    stemsValue,
    streamConditions,
    isDownloadGated,
    tempDownloadConditions
  ])

  const handleSubmit = useCallback(
    (values: StemsAndDownloadsFormValues) => {
      const availabilityType = get(values, DOWNLOAD_AVAILABILITY_TYPE)
      const downloadConditions = get(values, DOWNLOAD_CONDITIONS)

      // note that there is some redundancy with the is_downloadable field
      // this will go away once we remove the download object from track
      // and only keep the top level fields
      const allowsDownload =
        get(values, ALLOW_DOWNLOAD) ?? allowDownloadValue ?? false
      setAllowDownloadValue(allowsDownload)
      setIsDownloadable(allowsDownload)
      setFollowerGatedValue(
        get(values, FOLLOWER_GATED) ?? followerGatedValue ?? false
      )
      setisOriginalAvailable(
        get(values, IS_ORIGINAL_AVAILABLE) ?? isOriginalAvailable ?? false
      )
      setStemsValue(get(values, STEMS))
      setCidValue(null)

      // If download does not inherit from stream conditions,
      // extract the correct download conditions based on the selected availability type
      const inheritConditions = !!streamConditions
      if (!inheritConditions) {
        setIsDownloadGated(false)
        setDownloadConditions(null)

        switch (availabilityType) {
          case DownloadTrackAvailabilityType.USDC_PURCHASE: {
            const {
              usdc_purchase: { price }
            } = downloadConditions as USDCPurchaseConditions
            setDownloadConditions({
              // @ts-ignore fully formed in saga (validated + added splits)
              usdc_purchase: { price: Math.round(price) }
            })
            setIsDownloadGated(true)
            break
          }
          case DownloadTrackAvailabilityType.FOLLOWERS: {
            const { follow_user_id } =
              downloadConditions as FollowGatedConditions
            setDownloadConditions({ follow_user_id })
            setIsDownloadGated(true)
            setFollowerGatedValue(true)
            break
          }
          case DownloadTrackAvailabilityType.PUBLIC: {
            break
          }
        }
      }
    },
    [
      allowDownloadValue,
      followerGatedValue,
      isOriginalAvailable,
      streamConditions,
      setAllowDownloadValue,
      setFollowerGatedValue,
      setIsDownloadable,
      setisOriginalAvailable,
      setStemsValue,
      setCidValue,
      setIsDownloadGated,
      setDownloadConditions
    ]
  )

  const renderValue = () => {
    let values = []
    if (allowDownloadValue || isDownloadable) {
      values.push(messages.values.allowDownload)
    }
    if (followerGatedValue) {
      values.push(messages.values.followerGated)
    }
    if (isLosslessDownloadsEnabled && isOriginalAvailable) {
      values.push(messages.values.allowOriginal)
    }
    const stemsCategories =
      stemsValue?.map((stem) => stemCategoryFriendlyNames[stem.category]) ?? []
    values = [...values, ...stemsCategories]

    if (values.length === 0) return null

    return (
      <SelectedValues>
        {values.map((value) => (
          <SelectedValue key={value} label={value} />
        ))}
      </SelectedValues>
    )
  }

  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconSourceFiles />}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      renderValue={renderValue}
      validationSchema={toFormikValidationSchema(
        stemsAndDownloadsSchema(usdcPurchaseConfig)
      )}
      menuFields={<StemsAndDownloadsMenuFields />}
    />
  )
}
