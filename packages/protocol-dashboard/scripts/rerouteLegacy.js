const fs = require('fs')
const path = require('path');

let getContent = (baseUrl, path) => `
<head>
  <meta http-equiv="refresh" content="0;URL=${baseUrl}/#/${path}" />
</head>
<body>
  <p>This page has ben moved to <a href="${baseUrl}/#/${path}">${baseUrl}/#/${path}</a></p>
</body>`

const BUILD_PATH = './build'

const redirectPaths = [
  'analytics',
  'governance',
  'services',
  'services/discovery-node',
  'services/content-node',
  'services/service-providers',
  'services/users',
  'api',
  'api/leaderboard'
] 

const getBaseUrl = () => {
  if (process.argv.length === 3 && process.argv[2] == 'stage') {
    return 'https://dashboard.staging.audius.org'
  }
  return 'https://dashboard.audius.org'
}

const writeLegacyPathRedirects = () => {
  if (!fs.existsSync(BUILD_PATH)) {
    // If the build doesn't exist, return
    console.error(`Build path: ${BUILD_PATH} does not exist`)
    return 
  }
  for (let pathName of redirectPaths) {
    const fileFolder = path.join(__dirname, '../', BUILD_PATH, pathName)
    fs.mkdirSync(fileFolder, { recursive: true })

    const filePath = path.join(fileFolder, 'index.html')
    console.log(filePath)

    const baseURL = getBaseUrl()
    const file = getContent(baseURL, pathName)
    fs.writeFileSync(filePath, file, 'utf8')
  }
}


if (typeof require !== 'undefined' && require.main === module) {
  writeLegacyPathRedirects();
}