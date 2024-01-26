import { useCallback, useEffect, useState } from 'react'

import {
  AccessConditions,
  DownloadTrackAvailabilityType,
  FeatureFlags,
  Nullable,
  StemCategory,
  StemUpload,
  StemUploadWithFile,
  formatPrice,
  isContentUSDCPurchaseGated,
  removeNullable
} from '@audius/common'
import { useField } from 'formik'
import { z } from 'zod'

import { Divider } from 'components/divider'
import { Text } from 'components/typography'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'

import { processFiles } from '../store/utils/processFiles'

import {
  DOWNLOAD_CONDITIONS,
  STREAM_CONDITIONS,
  USDCPurchaseRemoteConfig
} from './AccessAndSaleField'
import { StemFilesView, dropdownRows as stemCategories } from './StemFilesView'
import styles from './StemsAndDownloadsField.module.css'
import { SwitchRowField } from './SwitchRowField'
import { DownloadAvailability } from './download-availability/DownloadAvailability'
import { DOWNLOAD_PRICE } from './download-availability/DownloadPriceField'

export const ALLOW_DOWNLOAD = 'download.is_downloadable'
export const FOLLOWER_GATED = 'download.requires_follow'
export const IS_DOWNLOADABLE = 'is_downloadable'
export const IS_ORIGINAL_AVAILABLE = 'is_original_available'
export const STEMS = 'stems'
export const DOWNLOAD_AVAILABILITY_TYPE = 'download_availability_type'

const messages = {
  description:
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
  [IS_ORIGINAL_AVAILABLE]: {
    header: 'Provide Lossless Files',
    description:
      'Provide your fans with the Lossless files you upload in addition to an mp3.'
  },
  priceTooLow: (minPrice: number) =>
    `Price must be at least $${formatPrice(minPrice)}.`,
  priceTooHigh: (maxPrice: number) =>
    `Price must be less than $${formatPrice(maxPrice)}.`,
  noDownloadableAssets:
    'You must enable the full track download or upload a stem file before setting download availability.'
}

export type StemsAndDownloadsFormValues = {
  [ALLOW_DOWNLOAD]: boolean
  [FOLLOWER_GATED]: boolean
  [IS_DOWNLOADABLE]: boolean
  [IS_ORIGINAL_AVAILABLE]: boolean
  [DOWNLOAD_CONDITIONS]: Nullable<AccessConditions>
  [STREAM_CONDITIONS]: Nullable<AccessConditions>
  [DOWNLOAD_AVAILABILITY_TYPE]: DownloadTrackAvailabilityType
  [STEMS]: StemUpload[]
}

export const stemsAndDownloadsSchema = ({
  minContentPriceCents,
  maxContentPriceCents
}: USDCPurchaseRemoteConfig) =>
  z
    .object({
      // [ALLOW_DOWNLOAD]: z.boolean(),
      // [FOLLOWER_GATED]: z.boolean(),
      [ALLOW_DOWNLOAD]: z.any(),
      [FOLLOWER_GATED]: z.any(),
      [STEMS]: z.any(),
      [IS_DOWNLOADABLE]: z.boolean(),
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

export const StemsAndDownloadsMenuFields = () => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
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
    { onChange: isDownloadableOnChange },
    ,
    { setValue: setIsDownloadable }
  ] = useField(IS_DOWNLOADABLE)
  const [
    { onChange: isOriginalAvailableOnChange },
    ,
    { setValue: setIsOriginalAvailable }
  ] = useField(IS_ORIGINAL_AVAILABLE)
  const [{ value: stemsValue }, , { setValue: setStems }] =
    useField<StemUploadWithFile[]>(STEMS)
  const [{ value: availabilityType }, , { setValue: setAvailabilityType }] =
    useField<DownloadTrackAvailabilityType>(DOWNLOAD_AVAILABILITY_TYPE)

  const [isAvailabilityTouched, setIsAvailabilityTouched] = useState(false)

  useEffect(() => {
    if (
      [
        DownloadTrackAvailabilityType.FOLLOWERS,
        DownloadTrackAvailabilityType.USDC_PURCHASE
      ].includes(availabilityType) &&
      !isAvailabilityTouched
    ) {
      allowDownloadSetValue(true)
      setIsDownloadable(true)
      setIsOriginalAvailable(true)
      setIsAvailabilityTouched(true)
    }
  }, [
    availabilityType,
    isAvailabilityTouched,
    allowDownloadSetValue,
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

  const onAddStemsToTrack = useCallback(
    async (selectedStems: File[]) => {
      const detectCategory = (filename: string): StemCategory => {
        const lowerCaseFilename = filename.toLowerCase()
        return (
          stemCategories.find((category) =>
            lowerCaseFilename.includes(category.toString().toLowerCase())
          ) ?? StemCategory.OTHER
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
        name={ALLOW_DOWNLOAD}
        header={messages[ALLOW_DOWNLOAD].header}
        description={messages[ALLOW_DOWNLOAD].description}
        onChange={(e) => {
          allowDownloadOnChange(e)
          isDownloadableOnChange(e)
          if (!e.target.checked) {
            followerGatedSetValue(false)
          } else {
            setIsOriginalAvailable(true)
          }
        }}
      />
      <Divider />
      {isLosslessDownloadsEnabled ? (
        <SwitchRowField
          name={IS_ORIGINAL_AVAILABLE}
          header={messages[IS_ORIGINAL_AVAILABLE].header}
          description={messages[IS_ORIGINAL_AVAILABLE].description}
          onChange={isOriginalAvailableOnChange}
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
              setIsDownloadable(true)
            }
          }}
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
