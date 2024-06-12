import { App, initializeDiscoveryDb } from "@pedalboard/basekit";
import { Users } from "@pedalboard/storage";
import { getPreviousState, logError } from "./utils";
import axios from "axios";
import retry from "async-retry"
import { sendSlackMsg } from "./slack";

const discoveryDb = initializeDiscoveryDb()

type SocialHandlesResponse = {
    twitterVerified?: string
    instagramVerified?: string
    tikTokVerified?: string
}

const { audius_discprov_identity_service_url, USERS_SLACK_CHANNEL } =
    process.env
const social_handle_url = (handle: string) =>
    `${audius_discprov_identity_service_url}/social_handles?handle=${handle}`

const onNewUserRow = async (userRow: Users) => {
    const { user_id, blocknumber } = userRow
    if (blocknumber === undefined || blocknumber === null) {
        console.warn('no block number returned')
        return
    }
    const current = await discoveryDb('users')
        .select('handle', 'is_verified')
        .where('user_id', '=', user_id)
        .first()
        .catch(console.error)
    const old = await getPreviousState({
        table: 'users',
        id: user_id,
        blocknumber
    })

    console.log({ current, old, user_id, blocknumber })

    if (current === undefined) {
        console.warn(
            { user_id, blocknumber },
            'user does not have a current record'
        )
        return
    }

    const is_new_user = old === undefined
    const new_user_is_verified = is_new_user && current.is_verified
    const is_existing_user = !is_new_user
    const existing_user_previously_unverified =
        is_existing_user && old.is_verified === false
    const user_currently_verified = current.is_verified === true
    const existing_user_became_verified =
        user_currently_verified && existing_user_previously_unverified

    console.log({
        user_id,
        existing_user_became_verified,
        new_user_is_verified,
        is_new_user,
        is_existing_user
    })

    if (existing_user_became_verified || new_user_is_verified) {
        const is_verified = current.is_verified
        const handle = current.handle

        let source
        try {
            const data = await retry(
                async (_) => {
                    const res = await axios
                        .get(social_handle_url(handle))
                        .catch(console.error);

                    if (res === undefined) {
                        throw new Error("no response")
                    }
                    const data: SocialHandlesResponse = res.data
                    if (Object.keys(data).length === 0) {
                        throw new Error('social handles not in identity yet');
                    }

                    return data
                }
            )
            const { twitterVerified, instagramVerified, tikTokVerified } = data

            if (twitterVerified) {
                source = 'twitter'
            }
            if (instagramVerified) {
                source = 'instagram'
            }
            if (tikTokVerified) {
                source = 'tiktok'
            }
        } catch (e) {
            source = 'could not figure out source!'
            console.error(e)
        }

        const header = `User *${handle}* ${is_verified ? 'is now' : 'is no longer'
            } verified via ${source}!`

        const body = {
            userId: user_id,
            handle,
            link: `https://audius.co/${handle}`,
            source
        }

        console.log({ to_slack: body }, 'user verification')
        await sendSlackMsg(USERS_SLACK_CHANNEL, header, body).catch(console.error)
    }
}

export const userRowHandler = async (app: App<object>, userRow: Users) => {
    try {
        await onNewUserRow(userRow)
    } catch (e: unknown) {
        logError(e, "user event error")
    }
}

