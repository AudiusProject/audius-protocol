const fs = require('fs')

const _ = require('lodash')
const axios = require('axios')
const retry = require('async-retry')
async function getUsers(discoveryProvider, limit, offset, maxRetries = 5) {
    return await retry(
        async () => {
            const response = await axios({
                method: 'get',
                url: '/users',
                baseURL: discoveryProvider,
                params: { limit, offset, is_creator: true }
            })

            return response.data.data
        },
        {
            retries: maxRetries
        }
    )
}
async function batchGetClockStatus(
    creatorNode,
    walletPublicKeys,
    maxRetries = 5
) {
    return await retry(
        async () => {
            const response = await axios({
                method: 'post',
                url: '/users/batch_clock_status',
                baseURL: creatorNode,
                data: { walletPublicKeys }
            })

            return response.data.users
        },
        {
            retries: maxRetries
        }
    )
}
async function run() {
    let output = []

    prevBatch = true
    for (let offset = 0; prevBatch; offset += 500) {
        console.time(`offset ${offset}`)

        batch = await getUsers('https://discoveryprovider.audius.co/', 500, offset)
        prevBatch = batch.length != 0

        batch = batch.filter(({ creator_node_endpoint }) => creator_node_endpoint)

        const wallets = {}
        batch.forEach(async ({ creator_node_endpoint, wallet }) => {
            creator_node_endpoint
                .split(',')
                .filter(el => el)
                .forEach(creatorNode => {
                    wallets[creatorNode] = wallets[creatorNode] || []
                    wallets[creatorNode].push(wallet)
                })
        })

        const clockValues = {}
        await Promise.all(
            Object.keys(wallets).map(async creatorNode => {
                clockValues[creatorNode] = _.chain(
                    await batchGetClockStatus(creatorNode, wallets[creatorNode])
                )
                    .keyBy('walletPublicKey')
                    .mapValues('clock')
                    .value()
            })
        )

        const batchOutput = await Promise.all(
            batch.map(async ({ creator_node_endpoint, wallet, handle, user_id }) => ({
                wallet,
                handle,
                user_id,
                clockValues: creator_node_endpoint
                    .split(',')
                    .filter(el => el)
                    .map((creatorNode, idx) => ({
                        creatorNode,
                        clock: clockValues[creatorNode][wallet],
                        primary: idx === 0
                    }))
            }))
        )

        output = output.concat(batchOutput)

        console.timeEnd(`offset ${offset}`)
    }

    output = _.sortBy(output, ['user_id'])

    fs.writeFileSync('data.json', JSON.stringify(output, null, 4))

    process.exit(0)
}

run()
