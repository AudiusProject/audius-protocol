/**
 * Tests a push notification
 */
import prompts from 'prompts'

import {
  SNSClient,
  PublishCommand,
  PublishCommandInput
} from '@aws-sdk/client-sns'
export const main = async () => {
  // Get Env Keys
  const message = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    targetARN: process.env.TARGET_ARN
  }
  const values = await prompts([
    { message: 'region', name: 'region', type: 'text', initial: 'us-west-1' },
    {
      message: 'accessKey',
      name: 'accessKey',
      type: 'text',
      initial: message.accessKeyId
    },
    {
      message: 'secret',
      name: 'secret',
      type: 'text',
      initial: message.secretAccessKey
    },
    {
      message: 'type',
      name: 'type',
      type: 'list',
      choices: [
        { title: 'ios', value: 'ios' },
        { title: 'android', value: 'android' }
      ],
      initial: 'ios'
    },
    { message: 'title', name: 'title', type: 'text', initial: 'test message' },
    { message: 'body', name: 'body', type: 'text', initial: 'test body' },
    {
      message: 'targetARN',
      name: 'targetARN',
      type: 'text',
      initial: message.targetARN
    }
  ])

  const snsClient = new SNSClient({
    region: values.region,
    credentials: {
      accessKeyId: values.accessKey,
      secretAccessKey: values.secret
    }
  })

  const publish = async (params: PublishCommandInput) => {
    try {
      const data = await snsClient.send(new PublishCommand(params))
      console.log('sns send success')
      return data // For unit tests.
    } catch (err) {
      console.log('Error', err.stack)
    }
  }

  const ARN = 'APNS'
  const sendIOSMessage = async ({
    title,
    body,
    badgeCount,
    data,
    playSound = true,
    targetARN
  }: {
    title: string
    body: string
    badgeCount: number
    data?: object
    playSound: boolean
    targetARN: string
  }) => {
    const message = JSON.stringify({
      ['default']: body,
      [ARN]: JSON.stringify({
        aps: {
          alert: {
            title,
            body
          },
          sound: playSound && 'default',
          badge: badgeCount
        },
        data
      })
    })

    await publish({
      TargetArn: targetARN,
      Message: message,
      MessageStructure: 'json'
    })
  }
  const sendAndroidMessage = async ({
    title,
    body,
    targetARN,
    data = {},
    playSound = true
  }: {
    title: string
    body: string
    targetARN: string
    data: object
    playSound: boolean
  }) => {
    const message = JSON.stringify({
      default: body,
      GCM: {
        notification: {
          ...(title ? { title } : {}),
          body,
          sound: playSound && 'default'
        },
        data
      }
    })

    await publish({
      TargetArn: targetARN,
      Message: message,
      MessageStructure: 'json'
    })
  }

  Object.entries(values).forEach(([k, v]) => {
    message[k] = message[k] || v
  })
  console.table(Object.entries(message).map(([k, v]) => ({ key: k, val: v })))

  if (values.type.includes('android')) {
    console.log('sending android notification')
    await sendAndroidMessage({
      title: values.title,
      body: values.body,
      data: {},
      playSound: true,
      targetARN: values.targetARN
    })
  }

  if (values.type.includes('ios')) {
    console.log('sending ios notification')
    await sendIOSMessage({
      title: values.title,
      body: values.body,
      badgeCount: 1,
      data: {},
      playSound: true,
      targetARN: values.targetARN
    })
  }
}

main()
