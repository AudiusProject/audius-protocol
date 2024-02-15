import { useCallback, useEffect, useState } from 'react'

import {
  AccessConditions,
  DownloadTrackAvailabilityType,
  StemCategory,
  StemUploadWithFile,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { removeNullable, formatPrice, Nullable } from '@audius/common/utils'
import { useField } from 'formik'
import { usePrevious } from 'react-use'
import { z } from 'zod'

import { Divider } from 'components/divider'
import { Text } from 'components/typography'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { stemDropdownRows } from 'utils/stems'

import { processFiles } from '../store/utils/processFiles'

import { USDCPurchaseRemoteConfig } from './AccessAndSaleField'
import { StemFilesView } from './StemFilesView'
import styles from './StemsAndDownloadsField.module.css'
import { SwitchRowField } from './SwitchRowField'
import { DownloadAvailability } from './download-availability/DownloadAvailability'
import {
  IS_DOWNLOAD_GATED,
  DOWNLOAD_CONDITIONS,
  STREAM_CONDITIONS,
  DOWNLOAD_AVAILABILITY_TYPE,
  DOWNLOAD_REQUIRES_FOLLOW,
  IS_DOWNLOADABLE,
  IS_ORIGINAL_AVAILABLE,
  STEMS,
  DOWNLOAD_PRICE,
  StemsAndDownloadsFormValues
} from './types'

const messages = {
  description:
    'Upload your stems and source files to allow fans to remix your track. This does not affect users ability to listen offline.',
  [IS_DOWNLOADABLE]: {
    header: 'Allow Full Track Download',
    description: 'Allow your fans to download a copy of your full track.'
  },
  [DOWNLOAD_REQUIRES_FOLLOW]: {
    header: 'Available Only to Followers',
    description:
      'Make your stems and source files available only to your followers'
  },
  [IS_ORIGINAL_AVAILABLE]: {
    header: 'Provide Lossless Files',
    description:
      'Provide your fans with the Lossless files you upload in addition to an mp3.'
  },
  priceTooLow: (minPrice: number) =>
    `Price must be at least $${formatPrice(minPrice)}.`,
  priceTooHigh: (maxPrice: number) =>
    `Price must be less than $${formatPrice(maxPrice)}.`,
  losslessNoDownloadableAssets:
    'You must enable full track download or upload a stem file to provide lossless files.',
  gatedNoDownloadableAssets:
    'You must enable full track download or upload a stem file before setting download availability.',
  noUsdcUploadAccess:
    'You don’t have access to sell your downloads. Please change your availability settings.'
}

type StemsAndDownloadsSchemaProps = USDCPurchaseRemoteConfig & {
  isUsdcUploadEnabled: boolean
}
export const stemsAndDownloadsSchema = ({
  minContentPriceCents,
  maxContentPriceCents,
  isUsdcUploadEnabled
}: StemsAndDownloadsSchemaProps) =>
  z
    .object({
      [IS_DOWNLOADABLE]: z.boolean(),
      [DOWNLOAD_REQUIRES_FOLLOW]: z.boolean(),
      [STEMS]: z.any(),
      [IS_ORIGINAL_AVAILABLE]: z.boolean(),
      [DOWNLOAD_CONDITIONS]: z.any(),
      [STREAM_CONDITIONS]: z.any(),
      [DOWNLOAD_AVAILABILITY_TYPE]: z.nativeEnum(DownloadTrackAvailabilityType)
    })
    .refine(
      (values) => {
        const formValues = values as StemsAndDownloadsFormValues
        const downloadConditions = formValues[DOWNLOAD_CONDITIONS]
        if (
          formValues[DOWNLOAD_AVAILABILITY_TYPE] ===
            DownloadTrackAvailabilityType.USDC_PURCHASE &&
          isContentUSDCPurchaseGated(downloadConditions)
        ) {
          const { price } = downloadConditions.usdc_purchase
          return price > 0 && price >= minContentPriceCents
        }
        return true
      },
      {
        message: messages.priceTooLow(minContentPriceCents),
        path: [DOWNLOAD_PRICE]
      }
    )
    .refine(
      (values) => {
        const formValues = values as StemsAndDownloadsFormValues
        const downloadConditions = formValues[DOWNLOAD_CONDITIONS]
        if (
          formValues[DOWNLOAD_AVAILABILITY_TYPE] ===
            DownloadTrackAvailabilityType.USDC_PURCHASE &&
          isContentUSDCPurchaseGated(downloadConditions)
        ) {
          return downloadConditions.usdc_purchase.price <= maxContentPriceCents
        }
        return true
      },
      {
        message: messages.priceTooHigh(maxContentPriceCents),
        path: [DOWNLOAD_PRICE]
      }
    )
    .refine(
      // cannot provide lossless files if no downloadable assets
      (values) => {
        const formValues = values as StemsAndDownloadsFormValues
        const isOriginalAvailable = formValues[IS_ORIGINAL_AVAILABLE]
        const isDownloadable = formValues[IS_DOWNLOADABLE]
        const stems = formValues[STEMS]
        const hasStems = stems.length > 0
        const hasDownloadableAssets = isDownloadable || hasStems
        return !isOriginalAvailable || hasDownloadableAssets
      },
      {
        message: messages.losslessNoDownloadableAssets,
        path: [IS_DOWNLOAD_GATED]
      }
    )
    .refine(
      // cannot be download gated if no downloadable assets
      (values) => {
        const formValues = values as StemsAndDownloadsFormValues
        const streamConditions = formValues[STREAM_CONDITIONS]
        const availabilityType = formValues[DOWNLOAD_AVAILABILITY_TYPE]
        const isDownloadGated = [
          DownloadTrackAvailabilityType.FOLLOWERS,
          DownloadTrackAvailabilityType.USDC_PURCHASE
        ].includes(availabilityType)
        const isDownloadable = formValues[IS_DOWNLOADABLE]
        const stems = formValues[STEMS]
        const hasStems = stems.length > 0
        const hasDownloadableAssets = isDownloadable || hasStems
        return streamConditions || !isDownloadGated || hasDownloadableAssets
      },
      {
        message: messages.gatedNoDownloadableAssets,
        path: [IS_DOWNLOAD_GATED]
      }
    )
    .refine(
      // cannot be download gated if usdc upload disabled
      (values) => {
        const formValues = values as StemsAndDownloadsFormValues
        const availabilityType = formValues[DOWNLOAD_AVAILABILITY_TYPE]
        const isUsdcGated =
          availabilityType === DownloadTrackAvailabilityType.USDC_PURCHASE
        return !isUsdcGated || isUsdcUploadEnabled
      },
      {
        message: messages.noUsdcUploadAccess,
        path: [IS_DOWNLOAD_GATED]
      }
    )

// Because the upload and edit forms share the same menu fields,
// we pass in the stems handlers in the edit flow to properly handle
// the selection, addition, and deletion of stems.
// May do another pass later to refactor.
type StemsAndDownloadsMenuFieldsProps = {
  isUpload: boolean
  initialDownloadConditions: Nullable<AccessConditions>
  stems?: StemUploadWithFile[]
  onAddStems?: (stems: any) => void
  onSelectCategory?: (category: StemCategory, index: number) => void
  onDeleteStem?: (index: number) => void
}

export const StemsAndDownloadsMenuFields = (
  props: StemsAndDownloadsMenuFieldsProps
) => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )
  const [{ value: isDownloadable }, , { setValue: setIsDownloadable }] =
    useField(IS_DOWNLOADABLE)
  const [, , { setValue: setIsOriginalAvailable }] = useField(
    IS_ORIGINAL_AVAILABLE
  )
  const [
    { value: downloadRequiresFollow },
    ,
    { setValue: setDownloadRequiresFollow }
  ] = useField(DOWNLOAD_REQUIRES_FOLLOW)
  const [{ value: stemsValue }, , { setValue: setStemsValue }] =
    useField<StemUploadWithFile[]>(STEMS)
  const previousStemsValue = usePrevious(stemsValue)
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>(STREAM_CONDITIONS)
  const [{ value: availabilityType }, , { setValue: setAvailabilityType }] =
    useField<DownloadTrackAvailabilityType>(DOWNLOAD_AVAILABILITY_TYPE)
  const [isAvailabilityTouched, setIsAvailabilityTouched] = useState(
    availabilityType !== DownloadTrackAvailabilityType.PUBLIC
  )
  const [firstTimeStemsUploaded, setFirstTimeStemsUploaded] = useState(true)

  // If the track is download gated for the first time,
  // set the track to be downloadable and allow lossless files
  useEffect(() => {
    const firstTimeDownloadGated =
      [
        DownloadTrackAvailabilityType.FOLLOWERS,
        DownloadTrackAvailabilityType.USDC_PURCHASE
      ].includes(availabilityType) && !isAvailabilityTouched
    if (firstTimeDownloadGated) {
      setIsDownloadable(true)
      setIsAvailabilityTouched(true)
      if (isLosslessDownloadsEnabled) {
        setIsOriginalAvailable(true)
      }
    }
  }, [
    availabilityType,
    isAvailabilityTouched,
    setIsDownloadable,
    isLosslessDownloadsEnabled,
    setIsOriginalAvailable
  ])

  // Allow lossless files by default if the track is downloadable.
  // If there are no downloadable assets, set the requires follow switch to false.
  // (the latter is only relevant until lossless downloads feature is live)
  // Note that the useEffect has been preferred to the corresponding onChange handlers
  // as those seemed to cause unwanted race conditions resulting in errors showing up incorrectly.
  useEffect(() => {
    if (isLosslessDownloadsEnabled && isDownloadable) {
      setIsOriginalAvailable(true)
    }
    if (!isDownloadable && stemsValue.length === 0) {
      setDownloadRequiresFollow(false)
    }
  }, [
    isLosslessDownloadsEnabled,
    setDownloadRequiresFollow,
    isDownloadable,
    setIsOriginalAvailable,
    stemsValue.length
  ])

  // If download requires follow is enabled, set the track to be downloadable.
  useEffect(() => {
    if (downloadRequiresFollow) {
      setIsDownloadable(true)
    }
  }, [downloadRequiresFollow, setIsDownloadable])

  // Allow full track download and provide lossless files if additional are uploaded for the first time.
  useEffect(() => {
    if (
      firstTimeStemsUploaded &&
      stemsValue.length > 0 &&
      previousStemsValue &&
      previousStemsValue.length < stemsValue.length
    ) {
      setFirstTimeStemsUploaded(false)
      setIsDownloadable(true)
      if (isLosslessDownloadsEnabled) {
        setIsOriginalAvailable(true)
      }
    }
  }, [
    firstTimeStemsUploaded,
    stemsValue,
    previousStemsValue,
    isLosslessDownloadsEnabled,
    setIsDownloadable,
    setIsOriginalAvailable
  ])

  const invalidAudioFile = (
    name: string,
    reason: 'corrupted' | 'size' | 'type'
  ) => {
    console.error('Invalid Audio File', { name, reason })
    // TODO: show file error
  }

  const detectCategory = useCallback(
    (filename: string): Nullable<StemCategory> => {
      const lowerCaseFilename = filename.toLowerCase()
      return (
        stemDropdownRows.find((category) =>
          lowerCaseFilename.includes(category.toString().toLowerCase())
        ) ?? null
      )
    },
    []
  )

  const handleAddStems = useCallback(
    async (selectedStems: File[]) => {
      const processedFiles = processFiles(selectedStems, invalidAudioFile)
      const newStems = (await Promise.all(processedFiles))
        .filter(removeNullable)
        .map((processedFile) => {
          const category = detectCategory(processedFile.file.name)
          return {
            ...processedFile,
            category,
            allowDelete: true,
            allowCategorySwitch: true
          }
        })
      setStemsValue([...stemsValue, ...newStems])
      props.onAddStems?.(selectedStems)
    },
    [detectCategory, props, setStemsValue, stemsValue]
  )

  const handleSelectCategory = useCallback(
    (category: StemCategory, index: number) => {
      stemsValue[index].category = category
      setStemsValue(stemsValue)
      props.onSelectCategory?.(category, index)
    },
    [props, setStemsValue, stemsValue]
  )

  const handleDeleteStem = useCallback(
    (index: number) => {
      stemsValue.splice(index, 1)
      setStemsValue(stemsValue)
      props.onDeleteStem?.(index)
    },
    [props, setStemsValue, stemsValue]
  )

  return (
    <div className={styles.fields}>
      <Text>{messages.description}</Text>
      <Divider />
      {isLosslessDownloadsEnabled ? (
        <DownloadAvailability
          isUpload={props.isUpload}
          initialDownloadConditions={props.initialDownloadConditions}
          value={availabilityType}
          setValue={setAvailabilityType}
        />
      ) : null}
      <SwitchRowField
        name={IS_DOWNLOADABLE}
        header={messages[IS_DOWNLOADABLE].header}
        description={messages[IS_DOWNLOADABLE].description}
      />
      <Divider />
      {isLosslessDownloadsEnabled ? (
        <SwitchRowField
          name={IS_ORIGINAL_AVAILABLE}
          header={messages[IS_ORIGINAL_AVAILABLE].header}
          description={messages[IS_ORIGINAL_AVAILABLE].description}
        />
      ) : (
        <SwitchRowField
          name={DOWNLOAD_REQUIRES_FOLLOW}
          header={messages[DOWNLOAD_REQUIRES_FOLLOW].header}
          description={messages[DOWNLOAD_REQUIRES_FOLLOW].description}
          disabled={!!streamConditions}
        />
      )}
      <Divider />
      <StemFilesView
        stems={stemsValue}
        onAddStems={handleAddStems}
        onSelectCategory={handleSelectCategory}
        onDeleteStem={handleDeleteStem}
        isUpload={props.isUpload}
      />
    </div>
  )
}
