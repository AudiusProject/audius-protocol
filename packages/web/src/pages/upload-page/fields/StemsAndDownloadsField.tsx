import { useCallback, useMemo } from 'react'

import {
  AccessConditions,
  Download,
  DownloadTrackAvailabilityType,
  FeatureFlags,
  FollowGatedConditions,
  Nullable,
  StemCategory,
  StemUpload,
  USDCPurchaseConditions,
  accountSelectors,
  removeNullable,
  stemCategoryFriendlyNames,
  useFeatureFlag
} from '@audius/common'
import { useField } from 'formik'
import { get, set } from 'lodash'
import { useSelector } from 'react-redux'

import IconSourceFiles from 'assets/img/iconSourceFiles.svg'
import {
  ContextualMenu,
  SelectedValue,
  SelectedValues
} from 'components/data-entry/ContextualMenu'
import { Divider } from 'components/divider'
import { Text } from 'components/typography'

import { useTrackField } from '../hooks'
import { processFiles } from '../store/utils/processFiles'

import {
  DOWNLOAD_CONDITIONS,
  IS_DOWNLOAD_GATED,
  STREAM_CONDITIONS,
  getCombinedDefaultGatedConditionValues
} from './AccessAndSaleField'
import {
  SourceFilesView,
  dropdownRows as stemCategories
} from './SourceFilesView'
import styles from './StemsAndDownloadsField.module.css'
import { SwitchRowField } from './SwitchRowField'
import { DownloadAvailability } from './download-availability/DownloadAvailability'

const { getUserId } = accountSelectors

const DOWNLOAD_AVAILABILITY_TYPE = 'download_availability_type'
const ALLOW_DOWNLOAD_BASE = 'is_downloadable'
const ALLOW_DOWNLOAD = 'download.is_downloadable'
const FOLLOWER_GATED_BASE = 'requires_follow'
const FOLLOWER_GATED = 'download.requires_follow'
const CID_BASE = 'cid'
const CID = 'download.cid'
const ALLOW_ORIGINAL = 'is_original_available'
const STEMS = 'stems'

const messages = {
  title: 'Stems & Downloads',
  description:
    'Upload your track’s source files and customize how fans download your files.',
  menuDescription:
    'Upload your stems and source files to allow fans to remix your track. This does not affect users ability to listen offline.',
  [ALLOW_DOWNLOAD]: {
    header: 'Allow Full Track Download',
    description: 'Allow your fans to download a copy of your full track.'
  },
  [FOLLOWER_GATED]: {
    header: 'Available Only to Followers',
    description:
      'Make your stems and source files available only to your followers'
  },
  [ALLOW_ORIGINAL]: {
    header: 'Provide Lossless Files',
    description:
      'Provide your fans with the Lossless files you upload in addition to an mp3.'
  },
  values: {
    allowDownload: 'Full Track Available',
    allowOriginal: 'Lossless Files Available',
    followerGated: 'Followers Only'
  }
}

export type StemsAndDownloadsFormValues = {
  [DOWNLOAD_AVAILABILITY_TYPE]: DownloadTrackAvailabilityType
  [DOWNLOAD_CONDITIONS]: Nullable<AccessConditions>
  [ALLOW_DOWNLOAD]: boolean
  [FOLLOWER_GATED]: boolean
  [ALLOW_ORIGINAL]: boolean
  [STEMS]: StemUpload[]
}

export const StemsAndDownloadsField = () => {
  const { isEnabled: isLosslessDownloadsEnabled } = useFeatureFlag(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const [{ value: allowDownloadValue }, , { setValue: setAllowDownloadValue }] =
    useTrackField<Download[typeof ALLOW_DOWNLOAD_BASE]>(ALLOW_DOWNLOAD)
  const [{ value: followerGatedValue }, , { setValue: setFollowerGatedValue }] =
    useTrackField<Download[typeof FOLLOWER_GATED_BASE]>(FOLLOWER_GATED)
  const [{ value: cid }, , { setValue: setCidValue }] =
    useTrackField<Download[typeof CID_BASE]>(CID)
  const [
    { value: isOriginalAvailable },
    ,
    { setValue: setisOriginalAvailable }
  ] = useTrackField<boolean>(ALLOW_ORIGINAL)
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
    set(initialValues, ALLOW_DOWNLOAD, allowDownloadValue)
    set(initialValues, FOLLOWER_GATED, followerGatedValue)
    set(initialValues, ALLOW_ORIGINAL, isOriginalAvailable)
    set(initialValues, CID, cid ?? null)
    set(initialValues, STEMS, stemsValue ?? [])
    set(initialValues, STREAM_CONDITIONS, streamConditions)
    set(initialValues, IS_DOWNLOAD_GATED, isDownloadGated)
    set(initialValues, DOWNLOAD_CONDITIONS, tempDownloadConditions)
    set(
      initialValues,
      DOWNLOAD_AVAILABILITY_TYPE,
      DownloadTrackAvailabilityType.PUBLIC
    )
    return initialValues as StemsAndDownloadsFormValues
  }, [
    allowDownloadValue,
    followerGatedValue,
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

      setAllowDownloadValue(
        get(values, ALLOW_DOWNLOAD) ?? allowDownloadValue ?? false
      )
      setFollowerGatedValue(
        get(values, FOLLOWER_GATED) ?? followerGatedValue ?? false
      )
      setisOriginalAvailable(
        get(values, ALLOW_ORIGINAL) ?? isOriginalAvailable ?? false
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
      setisOriginalAvailable,
      setStemsValue,
      setCidValue,
      setIsDownloadGated,
      setDownloadConditions
    ]
  )

  const renderValue = () => {
    let values = []
    if (allowDownloadValue) {
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
      menuFields={<StemsAndDownloadsMenuFields />}
    />
  )
}

const StemsAndDownloadsMenuFields = () => {
  const { isEnabled: isLosslessDownloadsEnabled } = useFeatureFlag(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const [
    { onChange: allowDownloadOnChange },
    ,
    { setValue: allowDownloadSetValue }
  ] = useField(ALLOW_DOWNLOAD)
  const [
    { onChange: followerGatedOnChange },
    ,
    { setValue: followerGatedSetValue }
  ] = useField(FOLLOWER_GATED)
  const [
    { onChange: allowOriginalOnChange },
    ,
    { setValue: allowOriginalSetValue }
  ] = useField(ALLOW_ORIGINAL)
  const [{ value: stemsValue }, , { setValue: setStems }] =
    useField<StemUpload[]>(STEMS)
  const [{ value: availabilityType }, , { setValue: setAvailabilityType }] =
    useTrackField<DownloadTrackAvailabilityType>(DOWNLOAD_AVAILABILITY_TYPE)

  const invalidAudioFile = (
    name: string,
    reason: 'corrupted' | 'size' | 'type'
  ) => {
    console.error('Invalid Audio File', { name, reason })
    // TODO: show file error
  }

  const onAddStemsToTrack = useCallback(
    async (selectedStems: File[]) => {
      const processedFiles = processFiles(selectedStems, invalidAudioFile)
      const newStems = (await Promise.all(processedFiles))
        .filter(removeNullable)
        .map((processedFile) => ({
          ...processedFile,
          category: stemCategories[0],
          allowDelete: true,
          allowCategorySwitch: true
        }))
      setStems([...stemsValue, ...newStems])
    },
    [setStems, stemsValue]
  )

  return (
    <div className={styles.fields}>
      <Text>{messages.menuDescription}</Text>
      <Divider />
      {isLosslessDownloadsEnabled ? (
        <DownloadAvailability
          value={availabilityType}
          setValue={setAvailabilityType}
        />
      ) : null}
      <SwitchRowField
        name={ALLOW_DOWNLOAD}
        header={messages[ALLOW_DOWNLOAD].header}
        description={messages[ALLOW_DOWNLOAD].description}
        onChange={(e) => {
          allowDownloadOnChange(e)
          if (!e.target.checked) {
            followerGatedSetValue(false)
          } else {
            allowOriginalSetValue(true)
          }
        }}
      />
      <Divider />
      {isLosslessDownloadsEnabled ? (
        <SwitchRowField
          name={ALLOW_ORIGINAL}
          header={messages[ALLOW_ORIGINAL].header}
          description={messages[ALLOW_ORIGINAL].description}
          onChange={(e) => {
            allowOriginalOnChange(e)
            if (e.target.checked) {
              allowOriginalSetValue(true)
            }
          }}
        />
      ) : (
        <SwitchRowField
          name={FOLLOWER_GATED}
          header={messages[FOLLOWER_GATED].header}
          description={messages[FOLLOWER_GATED].description}
          onChange={(e) => {
            followerGatedOnChange(e)
            if (e.target.checked) {
              allowDownloadSetValue(true)
            }
          }}
        />
      )}
      <Divider />
      <SourceFilesView
        onAddStems={onAddStemsToTrack}
        stems={stemsValue}
        onSelectCategory={(category: StemCategory, index: number) => {
          stemsValue[index].category = category
          setStems(stemsValue)
        }}
        onDeleteStem={(index) => {
          stemsValue.splice(index, 1)
          setStems(stemsValue)
        }}
      />
    </div>
  )
}
