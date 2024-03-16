import { useCallback, useMemo } from 'react'

import { useFeatureFlag, useUSDCPurchaseConfig } from '@audius/common/hooks'
import {
  DownloadTrackAvailabilityType,
  FollowGatedConditions,
  StemCategory,
  StemUploadWithFile,
  Track,
  TrackMetadata,
  USDCPurchaseConditions,
  isContentFollowGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors } from '@audius/common/store'
import { Button, IconCloudDownload, IconReceive } from '@audius/harmony'
import { FormikErrors } from 'formik'
import { get, set } from 'lodash'
import { useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  StemsAndDownloadsMenuFields,
  stemsAndDownloadsSchema
} from 'pages/upload-page/fields/StemsAndDownloadsMenuFields'
import { getCombinedDefaultGatedConditionValues } from 'pages/upload-page/fields/helpers'
import {
  DOWNLOAD_AVAILABILITY_TYPE,
  DOWNLOAD_CONDITIONS,
  DOWNLOAD_PRICE_HUMANIZED,
  GateKeeper,
  IS_DOWNLOADABLE,
  IS_DOWNLOAD_GATED,
  IS_ORIGINAL_AVAILABLE,
  LAST_GATE_KEEPER,
  STEMS,
  STREAM_CONDITIONS,
  StemsAndDownloadsFormValues
} from 'pages/upload-page/fields/types'

import { ContextualMenu } from './ContextualMenu'
import styles from './StemsAndDownloadsTriggerLegacy.module.css'

const { getUserId } = accountSelectors

const messages = {
  title: 'Stems & Downloads',
  description:
    'Upload your stems and source files to allow fans to remix your track. This does not affect users ability to listen offline.'
}

type StemsAndDownloadsTriggerLegacyProps = {
  stems: StemUploadWithFile[]
  onAddStems: (stems: any) => void
  onSelectCategory: (category: StemCategory, index: number) => void
  onDeleteStem: (index: number) => void
  fields: TrackMetadata
  onChangeField: (field: string, value: any) => void
  lastGateKeeper: GateKeeper
  setLastGateKeeper: (value: GateKeeper) => void
  initialForm: Track
  closeMenuCallback?: (data?: any) => void
}

export const StemsAndDownloadsTriggerLegacy = (
  props: StemsAndDownloadsTriggerLegacyProps
) => {
  const {
    stems,
    onAddStems,
    onSelectCategory,
    onDeleteStem,
    fields,
    onChangeField,
    lastGateKeeper,
    setLastGateKeeper,
    initialForm,
    closeMenuCallback
  } = props

  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )
  const usdcPurchaseConfig = useUSDCPurchaseConfig()

  const {
    stream_conditions: streamConditions,
    is_download_gated: isDownloadGated,
    download_conditions: savedDownloadConditions,
    is_downloadable: isDownloadable,
    is_original_available: isOriginalAvailable
  } = fields

  /**
   * Download conditions from inside the modal.
   * Upon submit, these values along with the selected access option will
   * determine the final download conditions that get saved to the track.
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
    set(initialValues, STEMS, stems ?? [])
    set(initialValues, IS_DOWNLOAD_GATED, isDownloadGated)
    set(initialValues, DOWNLOAD_CONDITIONS, tempDownloadConditions)
    set(initialValues, STREAM_CONDITIONS, streamConditions)
    set(initialValues, LAST_GATE_KEEPER, lastGateKeeper)

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
    // note that stems is not included in the dependency array
    // because it should not change initialValues after the initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDownloadable,
    isOriginalAvailable,
    isDownloadGated,
    tempDownloadConditions,
    savedDownloadConditions,
    streamConditions,
    lastGateKeeper
  ])

  const onSubmit = useCallback(
    (values: StemsAndDownloadsFormValues) => {
      const availabilityType = get(values, DOWNLOAD_AVAILABILITY_TYPE)
      const downloadConditions = get(values, DOWNLOAD_CONDITIONS)
      const isDownloadable = get(values, IS_DOWNLOADABLE)
      const lastGateKeeper = get(values, LAST_GATE_KEEPER)

      onChangeField(IS_DOWNLOADABLE, isDownloadable)
      onChangeField(IS_ORIGINAL_AVAILABLE, get(values, IS_ORIGINAL_AVAILABLE))

      if (isDownloadable) {
        setLastGateKeeper({
          ...lastGateKeeper,
          downloadable: 'stemsAndDownloads'
        })
      }

      // If download does not inherit from stream conditions,
      // extract the correct download conditions based on the selected availability type.
      if (!streamConditions) {
        onChangeField(IS_DOWNLOAD_GATED, false)
        onChangeField(DOWNLOAD_CONDITIONS, null)
        switch (availabilityType) {
          case DownloadTrackAvailabilityType.USDC_PURCHASE: {
            onChangeField(IS_DOWNLOAD_GATED, true)
            const {
              usdc_purchase: { price }
            } = downloadConditions as USDCPurchaseConditions
            onChangeField(DOWNLOAD_CONDITIONS, {
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
            onChangeField(IS_DOWNLOAD_GATED, true)
            const { follow_user_id } =
              downloadConditions as FollowGatedConditions
            onChangeField(DOWNLOAD_CONDITIONS, { follow_user_id })
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
    },
    [onChangeField, setLastGateKeeper, streamConditions]
  )

  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconReceive />}
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(
        stemsAndDownloadsSchema({
          isUsdcUploadEnabled: !!isUsdcUploadEnabled,
          ...usdcPurchaseConfig
        })
      )}
      menuFields={
        <StemsAndDownloadsMenuFields
          isUpload={false}
          initialDownloadConditions={initialForm.download_conditions}
          onAddStems={onAddStems}
          onSelectCategory={onSelectCategory}
          onDeleteStem={onDeleteStem}
        />
      }
      closeMenuCallback={closeMenuCallback}
      displayMenuErrorMessage={(
        errors: FormikErrors<StemsAndDownloadsFormValues>
      ) => {
        return errors[IS_DOWNLOAD_GATED] ?? null
      }}
      renderValue={() => null}
      previewOverride={(toggleMenu) => (
        <Button
          variant='common'
          size='small'
          className={styles.menuButton}
          name='stemsModal'
          onClick={toggleMenu}
          iconLeft={IconCloudDownload}
        >
          {messages.title}
        </Button>
      )}
    />
  )
}
