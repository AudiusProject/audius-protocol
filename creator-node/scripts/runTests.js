const fs = require('fs')
const { exec } = require('child_process')

const execCommand = (command, maxBuffer = 2048 * 2048) => {
  return new Promise((resolve, reject) => {
    const proc = exec(command, { maxBuffer })
    // Stream the stdout
    proc.stdout.on('data', data => {
      process.stdout.write(`${data}`)
    })

    // Stream the stderr
    proc.stderr.on('data', data => {
      process.stdout.write(`${data}`)
    })

    proc.on('close', exitCode => {
      if (exitCode !== 0) {
        reject(new Error(`${command} failed to execute`))
      } else {
        resolve()
      }
    })
  })
}

const runTest = async () => {
  const pgPort = process.env.POSTGRES_TEST_PORT
    ? process.env.POSTGRES_TEST_PORT
    : 4432

  process.env.dbUrl = `postgres://postgres:postgres@localhost:${pgPort}/audius_creator_node_test`
  process.env.storagePath = './test_file_storage'
  process.env.logLevel = 'info'

  // make storage path
  try {
    console.log(`Making directory ${process.env.storagePath}...`)
    if (!fs.existsSync(process.env.storagePath)) {
      fs.mkdirSync(process.env.storagePath)
    }
    console.log(`Directory ${process.env.storagePath} successfully made\n`)
  } catch (e) {
    throw new Error(
      `Could not create directory at path ${process.env.storagePath}:\n\t${e}`
    )
  }

  // docker command to check database table is made in docker container
  // -i flag because the pipe is the input and does not have a tty (-t) interface.
  // https://serverfault.com/questions/897847/what-does-the-input-device-is-not-a-tty-exactly-mean-in-docker-run-output
  const psqlCommand = `"psql -U postgres -tc \\"SELECT 1 FROM pg_database WHERE datname = 'audius_creator_node_test'\\" | grep -q 1 || psql -U postgres -c \\"CREATE DATABASE audius_creator_node_test\\""`
  try {
    console.log('Checking if audius_creator_node_test database exists...')
    // TODO: find some smarter way of exec'ing into container besides hardcoded name
    await execCommand(
      `docker exec -i audius-creator-node_db_1 /bin/sh -c ${psqlCommand}`
    )
    console.log(
      `Database audius_creator_node_test successfully made and/or already exists\n`
    )
  } catch (e) {
    throw new Error(
      `Issue with executing psql command in docker container:\n\t${e}`
    )
  }

  try {
    // run mocha
    console.log('Running tests...')
    await execCommand(`mocha --timeout 30000 --exit`)
    console.log('Tests finished!\n')
  } catch (e) {
    console.log(`Creator node tests failed:\n\t${e}`)
  }

  // rm storage path
  try {
    console.log(`Removing ${process.env.storagePath}...`)
    // fs method does not recursively delete dir, so rely on bash command
    await execCommand(`rm -r ${process.env.storagePath}`)
    console.log(`Successfully removed ${process.env.storagePath}`)
  } catch (e) {
    throw new Error(
      `Issue with removing directory at path ${process.env.storagePath}:\n\t${e}`
    )
  }
}

runTest()
