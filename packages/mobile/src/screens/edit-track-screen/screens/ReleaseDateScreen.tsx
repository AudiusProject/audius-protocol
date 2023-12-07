import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Nullable, PremiumConditions } from '@audius/common'
import {
    createRemixOfMetadata,
    isPremiumContentCollectibleGated,
    isPremiumContentUSDCPurchaseGated,
    remixSettingsActions,
    remixSettingsSelectors,
    Status,
    usePremiumContentAccess,
    removeNullable,
} from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { useField } from 'formik'
import { debounce } from 'lodash'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCaretLeft from 'app/assets/images/iconCaretLeft.svg'
import IconRemix from 'app/assets/images/iconRemix.svg'
// import { IconCalendarMonth } from '@audius/harmony'

import type { TextProps } from 'app/components/core'
import { TextInput, Divider, Button, Switch, Text } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { TopBarIconButton } from 'app/screens/app-screen'
import { makeStyles } from 'app/styles'
import { getTrackRoute } from 'app/utils/routes'

import { FormScreen, RemixTrackPill } from '../components'
import type { RemixOfField } from '../types'
import { ListSelectionData, ListSelectionScreen } from './ListSelectionScreen'
import { release } from 'os'
export enum ReleaseDateType {
    RELEASE_NOW = 'RELEASE_NOW',
    SCHEDULED_RELEASE = 'SCHEDULED_RELEASE'
}

const { getTrack, getUser, getStatus } = remixSettingsSelectors
const { fetchTrack, fetchTrackSucceeded, reset } = remixSettingsActions

const remixLinkInputDebounceMs = 1000

const messages = {
    screenTitle: 'Release Date',
    markRemix: 'Mark This Track as a Remix',
    isRemixLinkDescription: 'Paste the link to the Audius track you’ve remixed.',
    hideRemixesDescription:
        'Enabling this option will prevent other user’s remixes from appearing on your track page.',
    hideRemixes: 'Hide Remixes of this Track',
    done: 'Done',
    invalidRemixUrl: 'Please paste a valid Audius track URL',
    missingRemixUrl: 'Must include a link to the original track',
    remixAccessError: 'Must have access to the original track',
    enterLink: 'Enter an Audius Link',
    changeAvailbilityPrefix: 'Availablity is set to',
    changeAvailbilitySuffix:
        'To enable these options, change availability to Public.',
    premium: 'Premium (Pay-To-Unlock). ',
    collectibleGated: 'Collectible Gated. ',
    specialAccess: 'Special Access. '
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
    backButton: {
        marginLeft: -6
    },
    setting: {
        paddingHorizontal: spacing(6),
        paddingVertical: spacing(8)
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing(5)
    },
    inputRoot: {
        marginTop: spacing(4),
        paddingVertical: spacing(4),
        paddingLeft: spacing(4)
    },
    input: {
        fontSize: typography.fontSize.large
    },
    changeAvailability: {
        marginBottom: spacing(16)
    },
    changeAvailabilityText: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    }
}))

const labelProps: TextProps = {
    fontSize: 'large',
    weight: 'demiBold'
}

const descriptionProps: TextProps = {
    fontSize: 'large',
    weight: 'medium'
}

const data: ListSelectionData[] = [
    {
        label: ReleaseDateType.RELEASE_NOW,
        value: ReleaseDateType.RELEASE_NOW,
        disabled: false
    },
    {
        label: ReleaseDateType.SCHEDULED_RELEASE,
        value: ReleaseDateType.SCHEDULED_RELEASE,
        disabled: false
    }
].filter(removeNullable)

export const ReleaseNowRadioField = () => {

    return (
        <View>
            <Text weight='bold'>Release immediately</Text>
        </View>
    )
}

export const ScheduledReleaseRadioField = () => {

    return (
        <View>
            <Text weight='bold'>Schedule a release date</Text>
        </View>
    )
}

const items = {
    [ReleaseDateType.RELEASE_NOW]: (
        <ReleaseNowRadioField />
    ),
    [ReleaseDateType.SCHEDULED_RELEASE]: (
        <ScheduledReleaseRadioField />
    ),

}

export const ReleaseDateScreen = () => {

    return (
        <>
            <ListSelectionScreen
                data={data}
                renderItem={({ item }) => items[item.label]}
                screenTitle={"Release Date"}
            icon={IconRemix}
                value={'value'}
                onChange={() => { }}
                disableSearch
                allowDeselect={false}
                hideSelectionLabel
                bottomSection={
                    <Button
                        variant='primary'
                        size='large'
                        fullWidth
                        title={messages.done}
                        onPress={() => { }}
                        disabled={false}
                    />
                }
            />
        </>

    )
}
