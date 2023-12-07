import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Nullable, PremiumConditions } from '@audius/common'
import {
    createRemixOfMetadata,
    isPremiumContentCollectibleGated,
    isPremiumContentUSDCPurchaseGated,
    remixSettingsActions,
    remixSettingsSelectors,
    Status,
    usePremiumContentAccess
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

export const ReleaseDateScreen = () => {

    return (
        <FormScreen
            title={messages.screenTitle}
            icon={IconRemix}
            variant='white'
        >
            <View>
            </View>
        </FormScreen>
    )
}
