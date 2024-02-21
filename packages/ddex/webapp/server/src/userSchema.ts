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

interface IUserMethods {
  updateRoles(): any
}

interface UserModel extends mongoose.Model<IUser, object, IUserMethods> {
  findOrCreate(
    userId: string,
    doc: Partial<IUser>
  ): Promise<mongoose.HydratedDocument<IUser, IUserMethods>>
}

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
  _id: { type: String, required: true },
  decodedUserId: Number,
  handle: String,
  email: String,
  name: String,
  verified: { type: Boolean, default: false },
  profilePicture: { type: profilePictureSchema, default: null },
  isAdmin: { type: Boolean, default: false },
  isArtist: { type: Boolean, default: false },
})

userSchema.method('updateRoles', async function updateRoles() {
  const decodedUserId = decodeHashedId(this._id)
  if (!decodedUserId) return

  this.isAdmin = isUserAdmin(decodedUserId)
  this.isArtist = isUserArtist(decodedUserId)

  await this.save()
  return this
})

userSchema.static(
  'findOrCreate',
  async function findOrCreate(userId: string, doc: Partial<IUser>) {
    try {
      let user = (await this.findOne({ _id: userId })) as any

      if (!user) {
        user = await this.create({ ...doc })
      }

      return await user.updateRoles()
    } catch (error) {
      throw new Error(`Error in findOrCreate: ${error}`)
    }
  }
)

const User = mongoose.model<IUser, UserModel>('User', userSchema)

export default User
