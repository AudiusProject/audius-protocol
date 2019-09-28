import express from 'express'
import path from 'path'
import getMetaTagsResponse from './servlets/metaTags'

import libs from './libs'
import { MetaTagFormat } from './servlets/metaTags/types'

const PORT = 8000

const app = express()
const router = express.Router()

router.get([
  '/upload',
  '/upload/:type'], (
  req: express.Request,
  res: express.Response) => {
    getMetaTagsResponse(MetaTagFormat.Upload, req, res)
  }
)

router.get('/error', (
  req: express.Request,
  res: express.Response) => {
    getMetaTagsResponse(MetaTagFormat.Error, req, res)
  }
)

router.get('/:handle', (
  req: express.Request,
  res: express.Response) => {
    getMetaTagsResponse(MetaTagFormat.User, req, res)
  }
)

router.get('/:handle/:title', (
  req: express.Request,
  res: express.Response) => {
    getMetaTagsResponse(MetaTagFormat.Track, req, res)
  }
)

router.get([
  '/:handle/album/:title',
  '/:handle/playlist/:title'], (
  req: express.Request,
  res: express.Response) => {
    getMetaTagsResponse(MetaTagFormat.Collection, req, res)
  }
)

router.get('/', (
  req: express.Request,
  res: express.Response) => {
    getMetaTagsResponse(MetaTagFormat.Default, req, res)
})

router.get('*', (
  req: express.Request,
  res: express.Response) => {
    getMetaTagsResponse(MetaTagFormat.Default, req, res)
})

app.use(express.static(path.resolve(__dirname + '/public')))
app.use('/', router)

const start = async () => {
  await libs.init()
  app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
  })
}

start()
