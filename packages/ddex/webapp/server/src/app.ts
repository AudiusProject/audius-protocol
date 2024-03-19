import express, { Express, NextFunction, Request, Response } from 'express'
import path from 'path'
import session from 'express-session'
import connectMongoDBSession from 'connect-mongodb-session'
import User from './userSchema'
import createSdkService from './services/sdkService'
import { ProfilePicture } from '@audius/sdk'

declare module 'express-session' {
  interface SessionData {
    // This is the user in `authSessions`, which is different from the user in the `users` collection.
    // This one is just for session management and to pass to the frontend.
    user?: {
      userId: string
      decodedUserId: number
      handle: string
      name: string
      verified: boolean
      profilePicture: ProfilePicture | null
      isAdmin: boolean
    }
  }
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export default function createApp(
  dbUrl: string,
  sdkService: UnwrapPromise<ReturnType<typeof createSdkService>>
) {
  /*
   * Setup app
   */
  const app: Express = express()

  app.use(express.json())

  const MongoDBStore = connectMongoDBSession(session)
  const store = new MongoDBStore({
    uri: dbUrl,
    collection: 'authSessions',
  })
  store.on('error', function (error: any) {
    console.log(error)
  })

  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET not found in env')
  }

  const sess: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 * 3, // 3 weeks
    },
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset maxAge on every response
  }

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie!.secure = true // serve secure cookies
  }

  app.use(session(sess))

  if (!process.env.DDEX_KEY || !process.env.DDEX_SECRET) {
    throw new Error('DDEX_KEY or DDEX_SECRET not found in env')
  }

  /*
   * Define API routes
   */

  // Allows a user to "log in" to the DDEX backend by sending a JWT from Audius after OAuthing.
  // The frontend does this for the user on OAuth (there's no actual login button UI) and re-checks the session via /auth/session on page load.
  app.post('/auth/login', async (req: Request, res: Response) => {
    const decodedJwt = await sdkService.users.verifyIDToken({
      token: req.body.token,
    })
    if (decodedJwt?.data) {
      const { userId, handle, email, name, verified, profilePicture } =
        decodedJwt.data
      const user = await User.findOrCreate(userId, {
        _id: userId,
        handle,
        email,
        name,
        verified,
        profilePicture,
      })

      req.session.user = {
        userId: user._id,
        decodedUserId: user.decodedUserId,
        handle: user.handle,
        name: user.name,
        verified: user.verified,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin,
      }

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err)
          return res.status(500).json({ error: 'Failed to update session' })
        }
        res.json({ loggedIn: true, user: req.session.user })
      })
    } else {
      res.status(401).send('Invalid token')
    }
  })

  // Checks if the user is authenticated with DDEX (ie, they OAuthed with Audius and sent this DDEX backend a JWT via /auth/login)
  app.get('/auth/session', async (req, res) => {
    if (req.session.user) {
      const user = await User.findOne({ _id: req.session.user.userId })
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Update the user's isAdmin in case the allowlist changed
      const updatedUser = await user.updateRoles()
      if (!updatedUser?._id) {
        return res.status(404).json({ error: 'User not found after updating' })
      }

      req.session.user = {
        userId: updatedUser._id,
        decodedUserId: updatedUser.decodedUserId,
        handle: updatedUser.handle,
        name: updatedUser.name,
        verified: updatedUser.verified,
        profilePicture: updatedUser.profilePicture,
        isAdmin: updatedUser.isAdmin,
      }
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err)
          return res.status(500).json({ error: 'Failed to update session' })
        }
        res.json({ loggedIn: true, user: req.session.user })
      })
    } else {
      res.status(401).json({ loggedIn: false })
    }
  })

  app.post('/auth/logout', async (req, res) => {
    if (req.session) {
      try {
        await new Promise((resolve, reject) => {
          req.session.destroy((err) => {
            if (err) reject(err)
            else resolve(undefined)
          })
        })
        res.clearCookie('connect.sid')
        res.sendStatus(200)
      } catch (error) {
        console.error('Session destruction failed:', error)
        res.status(500).send('Failed to log out')
      }
    } else {
      res.status(400).send('No session to destroy')
    }
  })

  app.get('/api/env', (_req: Request, res: Response) => {
    const envData = {
      data: {
        env: process.env.NODE_ENV,
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
        awsBucketRaw: process.env.AWS_BUCKET_RAW,
        awsBucketIndexed: process.env.AWS_BUCKET_INDEXED,
        ddexKey: process.env.DDEX_KEY,
        ddexChoreography: process.env.DDEX_CHOREOGRAPHY,
      },
    }
    res.json(envData)
  })

  app.get('/api/health_check', (_req: Request, res: Response) => {
    res.status(200).send('DDEX is alive!')
  })

  /*
   * Serve the React app as static assets at the root path
   */

  const isDev = process.env.IS_DEV === 'true'
  const buildPath = isDev
    ? path.join(__dirname, '..', '..', 'client', 'dist')
    : path.join(__dirname, '..', 'public')
  app.use(express.static(buildPath))
  app.use(express.static(buildPath))
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(buildPath, 'index.html'))
  })

  // Fallback to handle client-side routing, excluding /api routes
  app.get('*', (req: Request, res: Response, next) => {
    if (req.url.startsWith('/api')) {
      return next()
    }
    res.sendFile(path.join(buildPath, 'index.html'))
  })

  const isAuthedAsAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.user?.isAdmin) {
      return next()
    }
    res.status(401).send('Not authenticated as an admin')
  }

  return { app, isAuthedAsAdmin }
}
