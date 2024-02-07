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
    'You must enable the full track download or upload a stem file before setting download availability.'
}

export const stemsAndDownloadsSchema = ({
  minContentPriceCents,
  maxContentPriceCents
}: USDCPurchaseRemoteConfig) =>
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

export const StemsAndDownloadsMenuFields = () => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )
  const [{ value: isDownloadable }, , { setValue: isDownloadableSetValue }] =
    useField(IS_DOWNLOADABLE)
  const [, , { setValue: setIsOriginalAvailable }] = useField(
    IS_ORIGINAL_AVAILABLE
  )
  const [
    { value: downloadRequiresFollow },
    ,
    { setValue: followerGatedSetValue }
  ] = useField(DOWNLOAD_REQUIRES_FOLLOW)
  const [{ value: stemsValue }, , { setValue: setStems }] =
    useField<StemUploadWithFile[]>(STEMS)
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>(STREAM_CONDITIONS)
  const [{ value: availabilityType }, , { setValue: setAvailabilityType }] =
    useField<DownloadTrackAvailabilityType>(DOWNLOAD_AVAILABILITY_TYPE)
  const [isAvailabilityTouched, setIsAvailabilityTouched] = useState(
    availabilityType !== DownloadTrackAvailabilityType.PUBLIC
  )

  // If the track is download gated for the first time,
  // set the track to be downloadable and allow lossless files
  useEffect(() => {
    const firstTimeDownloadGated =
      [
        DownloadTrackAvailabilityType.FOLLOWERS,
        DownloadTrackAvailabilityType.USDC_PURCHASE
      ].includes(availabilityType) && !isAvailabilityTouched
    if (firstTimeDownloadGated) {
      isDownloadableSetValue(true)
      setIsAvailabilityTouched(true)
      if (isLosslessDownloadsEnabled) {
        setIsOriginalAvailable(true)
      }
    }
  }, [
    availabilityType,
    isAvailabilityTouched,
    isDownloadableSetValue,
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
      followerGatedSetValue(false)
    }
  }, [
    isLosslessDownloadsEnabled,
    followerGatedSetValue,
    isDownloadable,
    setIsOriginalAvailable,
    stemsValue.length
  ])

  // If download requires follow is enabled, set the track to be downloadable.
  useEffect(() => {
    if (downloadRequiresFollow) {
      isDownloadableSetValue(true)
    }
  }, [downloadRequiresFollow, isDownloadableSetValue])

  const invalidAudioFile = (
    name: string,
    reason: 'corrupted' | 'size' | 'type'
  ) => {
    console.error('Invalid Audio File', { name, reason })
    // TODO: show file error
  }

  const onAddStemsToTrack = useCallback(
    async (selectedStems: File[]) => {
      const detectCategory = (filename: string): Nullable<StemCategory> => {
        const lowerCaseFilename = filename.toLowerCase()
        return (
          stemDropdownRows.find((category) =>
            lowerCaseFilename.includes(category.toString().toLowerCase())
          ) ?? null
        )
      }
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
      setStems([...stemsValue, ...newStems])
    },
    [setStems, stemsValue]
  )

  return (
    <div className={styles.fields}>
      <Text>{messages.description}</Text>
      <Divider />
      {isLosslessDownloadsEnabled ? (
        <DownloadAvailability
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
