import { useCallback, useMemo } from 'react'

import { creativeCommons, parseMusicalKey, License } from '@audius/common/utils'
import {
  Box,
  Flex,
  IconCcBy as IconCreativeCommons,
  IconInfo,
  IconRobot,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { useField } from 'formik'
import { get, set } from 'lodash'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { AiAttributionDropdown } from 'components/ai-attribution-modal/AiAttributionDropdown'
import {
  ContextualMenu,
  SelectedValue,
  SelectedValues
} from 'components/data-entry/ContextualMenu'
import { Divider } from 'components/divider'
import { useTrackField } from 'components/edit-track/hooks'
import { SingleTrackEditValues } from 'components/edit-track/types'
import { computeLicenseIcons } from 'components/edit-track/utils/computeLicenseIcons'
import { TextField } from 'components/form-fields'
import { SegmentedControlField } from 'components/form-fields/SegmentedControlField'
import layoutStyles from 'components/layout/layout.module.css'
import { Tooltip } from 'components/tooltip'
import { env } from 'services/env'

import styles from './AdvancedField.module.css'
import { DatePickerField } from './DatePickerField'
import { KeySelectField } from './KeySelectField'
import { SwitchRowField } from './SwitchRowField'

const { computeLicense, ALL_RIGHTS_RESERVED_TYPE, computeLicenseVariables } =
  creativeCommons

const messages = {
  title: 'Advanced',
  description:
    'Provide detailed metadata to help identify and manage your music.',
  isAiGenerated: 'AI-Generated',
  bpm: {
    header: 'Tempo',
    label: 'BPM',
    validError: 'Must be a valid decimal number'
  },
  musicalKey: 'Key',
  aiGenerated: {
    header: 'Mark this track as AI generated',
    tooltip:
      'If your AI-generated track was trained on an existing Audius artist, you can give them credit here. Only users who have opted-in will appear in this list.',
    placeholder: 'Search for Users',
    requiredError: 'Valid user must be selected.'
  },
  apiAllowed: {
    header: 'Disallow Streaming via the API',
    description:
      'Keep your track from being streamed on third-party apps or services that utilize the Audius API.'
  },
  isrcTooltip: `ISRC is used to identify individual sound recordings and music videos. ISWC is used to identify the underlying musical composition – the music and lyrics`,
  isrc: {
    header: 'ISRC',
    placeholder: 'CC-XXX-YY-NNNNN',
    validError: 'Must be valid ISRC format.'
  },
  iswc: {
    header: 'ISWC',
    placeholder: 'T-345246800-1',
    validError: 'Must be valid ISWC format.'
  },
  licenseType: 'License Type',
  allowAttribution: {
    header: 'Allow Attribution?',
    options: {
      false: 'No Attribution',
      true: 'Allow Attribution'
    }
  },
  commercialUse: {
    header: 'Commercial Use?',
    options: {
      false: 'Non-Commercial Use',
      true: 'Commercial Use'
    }
  },
  derivativeWorks: {
    header: 'Derivative Works?',
    options: {
      false: 'Not-Allowed',
      true: 'Share-Alike',
      null: 'Allowed'
    }
  },
  noLicense: 'All Rights Reserved',
  releaseDate: 'Release Date'
}

const IS_AI_ATTRIBUTED = 'isAiAttribution'
const BLOCK_THIRD_PARTY_STREAMING = 'blockThirdPartyStreaming'
const ALLOWED_API_KEYS = 'allowed_api_keys'
const AI_USER_ID = 'ai_attribution_user_id'
const ISRC = 'isrc'
const ISWC = 'iswc'
const RELEASE_DATE = 'release_date'
const LICENSE = 'license'
const LICENSE_TYPE = 'licenseType'
const ALLOW_ATTRIBUTION = 'licenseType.allowAttribution'
const COMMERCIAL_USE = 'licenseType.commercialUse'
const DERIVATIVE_WORKS = 'licenseType.derivativeWorks'
const BPM = 'bpm'
const MUSICAL_KEY = 'musical_key'
const IS_UNLISTED = 'is_unlisted'

const allowAttributionValues = [
  { key: false, text: messages.allowAttribution.options.false },
  { key: true, text: messages.allowAttribution.options.true }
]

const commercialUseValues = [
  { key: false, text: messages.commercialUse.options.false },
  { key: true, text: messages.commercialUse.options.true }
]

const derivativeWorksValues = [
  { key: false, text: messages.derivativeWorks.options.false },
  { key: true, text: messages.derivativeWorks.options.true },
  { key: null, text: messages.derivativeWorks.options.null }
]

// Use standard ISRC and ISWC formats, but allow for optional periods and hyphens
// ISRC: https://www.wikidata.org/wiki/Property:P1243
// ISWC: https://www.wikidata.org/wiki/Property:P1827
const isrcRegex = /^[A-Z]{2}-?[A-Z\d]{3}-?\d{2}-?\d{5}$/i
const iswcRegex = /^T-?\d{3}.?\d{3}.?\d{3}.?-?\d$/i

const AdvancedFormSchema = z
  .object({
    [IS_AI_ATTRIBUTED]: z.optional(z.boolean()),
    [BLOCK_THIRD_PARTY_STREAMING]: z.optional(z.boolean()),
    [ALLOWED_API_KEYS]: z.optional(z.array(z.string()).nullable()),
    [AI_USER_ID]: z.optional(z.number().nullable()),
    [ISRC]: z.optional(z.string().nullable()),
    [ISWC]: z.optional(z.string().nullable()),
    [ALLOW_ATTRIBUTION]: z.optional(z.boolean()),
    [COMMERCIAL_USE]: z.optional(z.boolean()),
    [DERIVATIVE_WORKS]: z.optional(z.boolean().nullable()),
    [BPM]: z.optional(z.number().nullable()),
    [MUSICAL_KEY]: z.optional(z.string().nullable())
  })
  .refine((form) => !form[IS_AI_ATTRIBUTED] || form[AI_USER_ID], {
    message: messages.aiGenerated.requiredError,
    path: [AI_USER_ID]
  })
  .refine((form) => !form[ISRC] || isrcRegex.test(form[ISRC]), {
    message: messages.isrc.validError,
    path: [ISRC]
  })
  .refine((form) => !form[ISWC] || iswcRegex.test(form[ISWC]), {
    message: messages.iswc.validError,
    path: [ISWC]
  })

export type AdvancedFormValues = z.input<typeof AdvancedFormSchema>

export type AdvancedFieldProps = { isHidden?: boolean }
export const AdvancedField = () => {
  const [{ value: aiUserId }, , { setValue: setAiUserId }] =
    useTrackField<SingleTrackEditValues[typeof AI_USER_ID]>(AI_USER_ID)
  const [{ value: isrcValue }, , { setValue: setIsrc }] =
    useTrackField<SingleTrackEditValues[typeof ISRC]>(ISRC)
  const [{ value: releaseDate }, , { setValue: setReleaseDate }] =
    useTrackField<SingleTrackEditValues[typeof RELEASE_DATE]>(RELEASE_DATE)
  const [{ value: iswcValue }, , { setValue: setIswc }] =
    useTrackField<SingleTrackEditValues[typeof ISWC]>(ISWC)
  const [{ value: license }, , { setValue: setLicense }] =
    useTrackField<License>(LICENSE)
  const [{ value: allowedApiKeys }, , { setValue: setAllowedApiKeys }] =
    useTrackField<SingleTrackEditValues[typeof ALLOWED_API_KEYS]>(
      ALLOWED_API_KEYS
    )
  const [{ value: bpm }, , { setValue: setBpm }] =
    useTrackField<SingleTrackEditValues[typeof BPM]>(BPM)
  const [{ value: musicalKey }, , { setValue: setMusicalKey }] =
    useTrackField<SingleTrackEditValues[typeof MUSICAL_KEY]>(MUSICAL_KEY)
  const [{ value: isHidden }] = useTrackField<boolean>(IS_UNLISTED)

  const initialValues = useMemo(() => {
    const initialValues = {}
    set(initialValues, AI_USER_ID, aiUserId)
    if (aiUserId) {
      set(initialValues, IS_AI_ATTRIBUTED, true)
    }
    set(initialValues, ISRC, isrcValue)
    set(initialValues, ISWC, iswcValue)
    set(initialValues, ALLOWED_API_KEYS, allowedApiKeys)
    set(initialValues, LICENSE_TYPE, computeLicenseVariables(license))
    set(initialValues, BLOCK_THIRD_PARTY_STREAMING, !!allowedApiKeys)
    set(initialValues, BPM, bpm)
    set(initialValues, MUSICAL_KEY, parseMusicalKey(musicalKey ?? ''))
    set(initialValues, RELEASE_DATE, releaseDate)
    set(initialValues, IS_UNLISTED, isHidden)
    return initialValues as AdvancedFormValues
  }, [
    aiUserId,
    isrcValue,
    iswcValue,
    allowedApiKeys,
    license,
    bpm,
    musicalKey,
    releaseDate,
    isHidden
  ])

  const onSubmit = useCallback(
    (values: AdvancedFormValues) => {
      if (get(values, IS_AI_ATTRIBUTED)) {
        setAiUserId(get(values, AI_USER_ID) ?? aiUserId)
      } else {
        setAiUserId(null)
      }
      if (get(values, BLOCK_THIRD_PARTY_STREAMING)) {
        setAllowedApiKeys([env.API_KEY])
      } else {
        setAllowedApiKeys(null)
      }
      setIsrc(get(values, ISRC) ?? isrcValue)
      setIswc(get(values, ISWC) ?? iswcValue)
      setLicense(
        computeLicense(
          get(values, ALLOW_ATTRIBUTION) ?? false,
          get(values, COMMERCIAL_USE) ?? false,
          get(values, DERIVATIVE_WORKS)
        ).licenseType
      )
      setBpm(get(values, BPM) ?? bpm)
      setMusicalKey(get(values, MUSICAL_KEY) ?? musicalKey)
      setReleaseDate(get(values, RELEASE_DATE) ?? releaseDate)
    },
    [
      setIsrc,
      isrcValue,
      setIswc,
      iswcValue,
      setLicense,
      setBpm,
      bpm,
      setMusicalKey,
      musicalKey,
      setReleaseDate,
      releaseDate,
      setAiUserId,
      aiUserId,
      setAllowedApiKeys
    ]
  )

  const renderValue = useCallback(() => {
    const value = []

    if (!license || license === ALL_RIGHTS_RESERVED_TYPE) {
      value.push(
        <SelectedValue key={messages.noLicense} label={messages.noLicense} />
      )
    }

    const licenseIcons = computeLicenseIcons(license)

    if (licenseIcons) {
      value.push(
        <SelectedValue>
          {licenseIcons.map(([Icon, key]) => (
            <Icon key={key} size='s' color='default' />
          ))}
        </SelectedValue>
      )
    }
    if (isrcValue) {
      value.push(<SelectedValue key={isrcValue} label={isrcValue} />)
    }

    if (iswcValue) {
      value.push(<SelectedValue key={iswcValue} label={iswcValue} />)
    }
    if (aiUserId) {
      value.push(
        <SelectedValue label={messages.isAiGenerated} icon={IconRobot} />
      )
    }
    if (bpm) {
      value.push(
        <SelectedValue
          key={messages.bpm.header}
          label={`${bpm} ${messages.bpm.label}`}
        />
      )
    }
    if (musicalKey) {
      value.push(
        <SelectedValue
          key={messages.musicalKey}
          label={parseMusicalKey(musicalKey)}
        />
      )
    }
    return <SelectedValues key={messages.isAiGenerated}>{value}</SelectedValues>
  }, [license, isrcValue, iswcValue, aiUserId, bpm, musicalKey])

  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconCreativeCommons />}
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(AdvancedFormSchema)}
      menuFields={<AdvancedModalFields />}
      renderValue={renderValue}
    />
  )
}

const AdvancedModalFields = () => {
  const [aiUserIdField, aiUserHelperFields, { setValue: setAiUserId }] =
    useField({
      name: AI_USER_ID,
      type: 'select'
    })
  const [{ value: allowAttribution }] = useField<boolean>(ALLOW_ATTRIBUTION)
  const [{ value: commercialUse }] = useField<boolean>(COMMERCIAL_USE)
  const [{ value: derivativeWorks }] = useField<boolean>(DERIVATIVE_WORKS)
  const [{ value: isHidden }] = useField<boolean>(IS_UNLISTED)

  const { licenseType, licenseDescription } = computeLicense(
    allowAttribution,
    commercialUse,
    derivativeWorks
  )

  const licenseIcons = computeLicenseIcons(licenseType)

  const dropdownHasError =
    aiUserHelperFields.touched && aiUserHelperFields.error

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      <div className={cn(layoutStyles.col, layoutStyles.gap6)}>
        <Text variant='title' size='l' tag='h3'>
          {messages.licenseType}
        </Text>
        <div className={styles.attributionCommercialRow}>
          <div
            className={cn(
              styles.attributionRowItem,
              layoutStyles.col,
              layoutStyles.gap2
            )}
          >
            <Text variant='title' size='m' tag='label' id='allow-attribution'>
              {messages.allowAttribution.header}
            </Text>
            <SegmentedControlField
              aria-labelledby='allow-attribution'
              name={ALLOW_ATTRIBUTION}
              options={allowAttributionValues}
              fullWidth
            />
          </div>
          <Divider className={styles.verticalDivider} type='vertical' />
          <div
            className={cn(
              styles.attributionRowItem,
              layoutStyles.col,
              layoutStyles.gap2,
              {
                [styles.disabled]: !allowAttribution
              }
            )}
          >
            <Text variant='title' size='m' tag='label' id='commercial'>
              {messages.commercialUse.header}
            </Text>
            <SegmentedControlField
              aria-labelledby='commercial'
              name={COMMERCIAL_USE}
              options={commercialUseValues}
              disabled={!allowAttribution}
              fullWidth
            />
          </div>
        </div>
        <div className={cn(layoutStyles.col, layoutStyles.gap2)}>
          <Text
            className={cn({ [styles.disabled]: !allowAttribution })}
            variant='title'
            size='m'
            tag='label'
            id='derivative-works'
          >
            {messages.derivativeWorks.header}
          </Text>
          <SegmentedControlField
            aria-labelledby='derivative-works'
            name={DERIVATIVE_WORKS}
            fullWidth
            options={derivativeWorksValues}
            disabled={!allowAttribution}
          />
        </div>
      </div>
      <div className={styles.license}>
        <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
          {licenseIcons ? (
            <div className={cn(layoutStyles.row, layoutStyles.gap1)}>
              {licenseIcons.map(([Icon, key]) => (
                <Icon key={key} color='default' />
              ))}
            </div>
          ) : null}
          <Text variant='title' size='m' tag='h4'>
            {licenseType}
          </Text>
        </div>
        {licenseDescription ? <Text size='s'>{licenseDescription}</Text> : null}
      </div>
      <Divider />
      <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
        <Text variant='title' size='l' tag='h3'>
          <Flex alignItems='center' gap='xs'>
            {`${messages.isrc.header} / ${messages.iswc.header}`}
            <Tooltip text={messages.isrcTooltip}>
              <IconInfo size='m' color='subdued' />
            </Tooltip>
          </Flex>
        </Text>
        <span className={cn(layoutStyles.row, layoutStyles.gap6)}>
          <div className={styles.textFieldContainer}>
            <TextField
              name={ISRC}
              label={messages.isrc.header}
              placeholder={messages.isrc.placeholder}
            />
          </div>
          <div className={styles.textFieldContainer}>
            <TextField
              name={ISWC}
              label={messages.iswc.header}
              placeholder={messages.iswc.placeholder}
            />
          </div>
        </span>
        {!isHidden ? (
          <>
            <Divider />
            <Flex gap='m' direction='column'>
              <Text variant='title' size='l' tag='h3'>
                Release Date
              </Text>
              <DatePickerField
                name={RELEASE_DATE}
                label={messages.releaseDate}
              />
            </Flex>
          </>
        ) : null}
        <Divider />
        <span className={cn(layoutStyles.row, layoutStyles.gap6)}>
          <Flex direction='column' w='100%'>
            <Box mb='m'>
              <Text variant='title' size='l' tag='h3'>
                {messages.bpm.header}
              </Text>
            </Box>

            <TextField
              name={BPM}
              type='number'
              maxLength={3}
              onInput={(e) => {
                const input = e.nativeEvent.target as HTMLInputElement
                input.value = input.value.slice(0, input.maxLength)
              }}
              label={messages.bpm.header}
              placeholder={messages.bpm.label}
              autoComplete='off'
            />
          </Flex>
          <Flex direction='column' w='100%'>
            <Box mb='m'>
              <Text variant='title' size='l' tag='h3'>
                Key
              </Text>
            </Box>

            <KeySelectField name={MUSICAL_KEY} />
          </Flex>
        </span>
      </div>
      <Divider />
      <SwitchRowField
        name={BLOCK_THIRD_PARTY_STREAMING}
        header={messages.apiAllowed.header}
        description={messages.apiAllowed.description}
      />
      <Divider />
      <SwitchRowField
        name={IS_AI_ATTRIBUTED}
        header={messages.aiGenerated.header}
        tooltipText={messages.aiGenerated.tooltip}
      >
        <AiAttributionDropdown
          {...aiUserIdField}
          error={dropdownHasError}
          helperText={dropdownHasError && aiUserHelperFields.error}
          value={aiUserIdField.value}
          onSelect={(value: SingleTrackEditValues[typeof AI_USER_ID]) => {
            setAiUserId(value ?? null)
          }}
        />
      </SwitchRowField>
      <Divider />
    </div>
  )
}
