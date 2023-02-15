const axios = require('axios')
const { program } = require('commander')

async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run (
  requests,
  { identityEndpoint, discoveryEndpoint, pollDuration }
) {
  const start = Date.now()

  requests = requests || 50

  const success = await Promise.all(
    Array.apply(null, { length: requests }).map(async () => {
      const trackId = Math.floor(Math.random() * 1000000)
      const userId = Math.floor(Math.random() * 1000000)

      try {
        console.log(
          `Sending track listen | trackId=${trackId}, userId=${userId}`
        )

        const requestOptions = {
          method: 'POST',
          url: `${identityEndpoint}/tracks/${trackId}/listen`,
          headers: { 'content-type': 'application/json' },
          data: { solanaListen: true, userId }
        }

        const response = (await axios(requestOptions)).data
        const signature = response.solTxSignature

        console.log(
          `Successfully sent track listen | trackId=${trackId}, userId=${userId} | signature=${signature}`
        )

        const pollStart = Date.now()
        let solPlay = (
          await axios.get(
            `${discoveryEndpoint}/get_sol_play?tx_sig=${signature}`
          )
        ).data.data
        while (solPlay === null && Date.now() - pollStart < pollDuration) {
          await sleep(500)
          solPlay = (
            await axios.get(
              `${discoveryEndpoint}/get_sol_play?tx_sig=${signature}`
            )
          ).data.data
        }

        if (solPlay && solPlay.signature === signature) {
          console.log(
            `Found ${signature} in discovery provider after polling for ${
              Date.now() - pollStart
            }ms`
          )
          return true
        } else {
          console.log(
            `Failed to find ${signature} in discovery provider after polling for ${
              Date.now() - pollStart
            }ms`
          )
          return false
        }
      } catch (e) {
        console.log(
          `Failed to send track listen | trackId=${trackId}, userId=${userId}`
        )
        return false
      }
    })
  )

  const numSuccess = success.filter(s => s).length
  const numFailed = requests - numSuccess
  const duration = Date.now() - start

  console.log(
    `Processed ${requests} listens | success=${numSuccess} failed=${numFailed} duration=${duration}ms`
  )
}

async function main () {
  program
    .arguments('[requests]')
    .option(
      '-p, --poll-duration <pollDuration>',
      'duration to poll for confirming write to discovery provider',
      30000
    )
    .option(
      '-i, --identity-endpoint <identityEndpoint>',
      'identity service endpoint',
      'http://localhost:7000'
    )
    .option(
      '-d, --discovery-endpoint <discoveryEndpoint>',
      'discovery provider endpoint',
      'http://localhost:5000'
    )
    .action(run)

  try {
    await program.parseAsync(process.argv)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

main()
