import type { ProfilePicture } from '@audius/sdk'
import mongoose from 'mongoose'
import { decodeHashedId, isUserAdmin, isUserArtist } from './utils'

export interface IUser {
  _id: string // Use _id to store the userId
  decodedUserId: number
  handle: string
  email: string
  name: string
  verified: boolean
  profilePicture: ProfilePicture | null
  isAdmin: boolean
  isArtist: boolean
}

const profilePictureSchema = new mongoose.Schema({
  '150x150': String,
  '480x480': String,
  '1000x1000': String,
})

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    decodedUserId: Number,
    handle: String,
    email: String,
    name: String,
    verified: { type: Boolean, default: false },
    profilePicture: { type: profilePictureSchema, default: null },
    isAdmin: { type: Boolean, default: false },
    isArtist: { type: Boolean, default: false },
  },
  {
    statics: {
      async updateRoles(userId: string) {
        const decodedUserId = decodeHashedId(userId)
        if (!decodedUserId) return

        await User.updateOne(
          { _id: userId },
          {
            $set: {
              decodedUserId: decodedUserId,
              isAdmin: isUserAdmin(decodedUserId),
              isArtist: isUserArtist(decodedUserId),
            },
          }
        )
      },
      async findOrCreate(userId: string, doc: Partial<IUser>) {
        try {
          let user = await this.findOne({ _id: userId })

          if (!user) {
            user = await this.create({ ...doc })
          }

          // @ts-expect-error Property 'updateRoles' does not exist on type ...
          await this.updateRoles(user.userId!)

          return user
        } catch (error) {
          throw new Error(`Error in findOrCreate: ${error}`)
        }
      },
    },
  }
)

const User = mongoose.model('User', userSchema)

export default User
