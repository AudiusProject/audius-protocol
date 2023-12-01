import { Text } from '@audius/harmony'
import {
    IconCalendar
} from '@audius/stems'
import styles from './ScheduledReleaseLabel.module.css'

import moment from 'moment'

const messages = {
    collectibleGated: 'Collectible Gated',
    specialAccess: 'Special Access',
    premium: 'Premium'
}

/** Renders a label indicating a premium content type. If the user does
 * not yet have access or is the owner, the label will be in an accented color.
 */
export const ScheduledReleaseLabel = ({ released
}) => {
    console.log('asdf released: ', released)
    return (
        <>
            <IconCalendar className={styles.scheduledReleaseCalendar} />
            <Text
                color="accent"
                strength="weak"
                variant="title"
            >
                Releases on {moment(released).calendar()}
            </Text>
        </>
    )
}
