import * as child_process from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const execCommand = async (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const cmd = command + ` ${args.join(' ')}`
      child_process.execSync(cmd, { stdio: 'inherit', env: process.env })
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

const syncBucket = async (
  source: string,
  destination: string,
  profile: string
): Promise<void> => {
  const cmdArgs = ['s3', 'sync', source, destination]
  if (profile) {
    cmdArgs.push('--profile', profile)
  }
  await execCommand('aws', cmdArgs)
}

const bucketExists = async (
  bucketName: string,
  profile: string
): Promise<boolean> => {
  try {
    await execCommand('aws', [
      's3',
      'ls',
      `s3://${bucketName}`,
      '--profile',
      profile,
    ])
    return true
  } catch (error) {
    return false
  }
}

const createBucket = async (
  bucketName: string,
  profile: string
): Promise<void> => {
  await execCommand('aws', [
    's3',
    'mb',
    `s3://${bucketName}`,
    '--profile',
    profile,
  ])
}

export const sync = async (bucketPath: string): Promise<void> => {
  if (!bucketPath.startsWith('s3://')) {
    console.error('Invalid S3 path. Make sure it starts with s3://')
    process.exit(1)
  }
  const bucketName = bucketPath.slice(5).split('/')[0]

  try {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tmp-'))
    console.log(`Temporary directory created at: ${tmpDir}`)

    // Clean up the temporary directory after use
    process.on('exit', () => {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    console.log('Syncing from S3 bucket to tmp...')
    await syncBucket(bucketPath, tmpDir, 'default')

    // Check if the S3 bucket exists and create it if it does not
    if (!(await bucketExists(bucketName, 'local'))) {
      console.log(`Bucket does not exist, creating bucket: ${bucketName}`)
      await createBucket(bucketName, 'local')
    }

    console.log('Syncing from tmp to local S3 bucket...')
    await syncBucket(tmpDir, bucketPath, 'local')

    console.log('Sync done!')
    console.log(`aws s3 ls ${bucketPath} --profile local`)
  } catch (error) {
    console.error(`Error: ${(error as unknown as any).message}`)
    process.exit(1)
  }
}
