/**
 * Tests a push notification
 */
import { sendIOSMessage, sendAndroidMessage } from "../src/sns"
import inquirer from 'inquirer'

export const main = async () => {
  // Get Env Keys
  const message = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
  // If
  const values = await inquirer.prompt([
    { name: 'region', type: 'input', default: 'us-west-1' },
    { name: 'accessKey', type: 'input', default: message.accessKeyId },
    { name: 'secret', type: 'input', default: message.secretAccessKey },
    { name: 'type', type: 'list', choices: ['ios', 'android'], default: 'ios' },
    { name: 'title', type: 'input', default: 'test message' },
    { name: 'body', type: 'input', default: 'test body' },
    { name: 'targetARN', type: 'input' },
  ])
  Object.entries(values).forEach(([k, v]) => {
    message[k] = message[k] || v
  })
  console.table(Object.entries(message).map(([k, v]) => ({ key: k, val: v })));

  let type = ''
  if (type == 'android') {
    // await sendAndroidMessage()
  } else {
    // await sendIOSMessage()
  }

}

main()