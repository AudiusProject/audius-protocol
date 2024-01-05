import { useMemo } from 'react'

import {
    PremiumConditionsCollectibleGated,
    PremiumConditionsFollowGated,
    PremiumConditionsTipGated,
    PremiumConditionsUSDCPurchase,
    Track,
    TrackAvailabilityType,
    accountSelectors,
    isPremiumContentCollectibleGated,
    isPremiumContentFollowGated,
    isPremiumContentTipGated,
    isPremiumContentUSDCPurchaseGated,
    useUSDCPurchaseConfig,
    Nullable,
    PremiumConditions
} from '@audius/common'
import {
    Button,
    ButtonSize,
    ButtonType,
    IconCalendar,
    IconCart,
    IconCollectible,
    IconHidden,
    IconSpecialAccess,
    IconVisibilityPublic
} from '@audius/stems'
import { set, get } from 'lodash'
import { useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { defaultFieldVisibility } from 'pages/track-page/utils'
import { SpecialAccessType } from 'pages/upload-page/fields/availability/SpecialAccessFields'

import styles from './ReleaseDateTriggerLegacy.module.css'
import { ContextualMenu } from './ContextualMenu'
import { RELEASE_DATE, RELEASE_DATE_HOUR, RELEASE_DATE_MERIDIAN, RELEASE_DATE_TYPE, ReleaseDateRadioItems, ReleaseDateField, ReleaseDateType } from 'pages/upload-page/fields/ReleaseDateField'
import moment from 'moment'

const { getUserId } = accountSelectors

const messages = {
    title: 'Release Date',
    description:
        "Customize your music's availability for different audiences, and create personalized gated experiences for your fans.",
    public: 'Public (Default)',
    premium: 'Premium',
    specialAccess: 'Special Access',
    collectibleGated: 'Collectible Gated',
    hidden: 'Hidden'
}

enum PremiumTrackMetadataField {
    IS_PREMIUM = 'is_premium',
    PREMIUM_CONDITIONS = 'premium_conditions',
    PREVIEW = 'preview_start_seconds'
}

enum UnlistedTrackMetadataField {
    SCHEDULED_RELEASE = 'scheduled_release',
    UNLISTED = 'unlisted',
    GENRE = 'genre',
    MOOD = 'mood',
    TAGS = 'tags',
    SHARE = 'share',
    PLAYS = 'plays'
}

type TrackMetadataState = {
    is_scheduled_release: boolean,
    is_unlisted: boolean,
    release_date: string

}

type ReleaseDateTriggerLegacyProps = {
    isRemix: boolean
    isUpload: boolean
    initialForm: Track
    metadataState: TrackMetadataState
    trackLength: number
    didUpdateState: (newState: TrackMetadataState) => void
}

export const ReleaseDateTriggerLegacy = (
    props: ReleaseDateTriggerLegacyProps
) => {
    const trackReleaseDate = props.metadataState.release_date

    const initialValues = useMemo(() => {
        return {
            [RELEASE_DATE]: trackReleaseDate ?? moment().startOf('day').toString(),
            [RELEASE_DATE_HOUR]: trackReleaseDate
                ? moment(trackReleaseDate).format('h:mm')
                : moment().format('h:mm'),
            [RELEASE_DATE_MERIDIAN]: trackReleaseDate
                ? moment(trackReleaseDate).format('A')
                : moment().format('A'),
            [RELEASE_DATE_TYPE]: trackReleaseDate
                ? ReleaseDateType.SCHEDULED_RELEASE
                : ReleaseDateType.RELEASE_NOW
        }
    }, [trackReleaseDate])
    console.log('asdf initialValues: ', initialValues, trackReleaseDate, props)
    const onSubmit = () => {
    }
    return (
        <ContextualMenu
            label={messages.title}
            description={messages.description}
            icon={<IconHidden />}
            initialValues={initialValues}
            onSubmit={onSubmit}
            menuFields={
                <ReleaseDateRadioItems isUnlisted={props.metadataState.is_unlisted} isScheduledRelease={props.metadataState.is_scheduled_release} />
            }
            renderValue={() => null}
            previewOverride={(toggleMenu) => (
                <Button
                    className={styles.releaseDateButton}
                    type={ButtonType.COMMON_ALT}
                    name='availabilityModal'
                    text={'Release Date: ' + trackReleaseDate}
                    size={ButtonSize.SMALL}
                    onClick={toggleMenu}
                    leftIcon={<IconCalendar />}
                />
            )}
        />
    )
}
