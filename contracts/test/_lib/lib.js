/** Wrapper class for all e2e tests */

import { unregisterContractAndValidate, assertNoContractExists } from './testContract'
import {
  addPlaylistAndValidate,
  updatePlaylistPrivacyAndValidate,
  orderPlaylistTracksAndValidate,
  updatePlaylistNameAndValidate,
  updatePlaylistCoverPhotoAndValidate,
  updatePlaylistUPCAndValidate,
  updatePlaylistDescriptionAndValidate,
  addPlaylistRepostAndValidate,
  deletePlaylistRepostAndValidate,
  addPlaylistTrack,
  deletePlaylistTrack,
  addPlaylistSaveAndValidate,
  deletePlaylistSaveAndValidate,
  deletePlaylistAndValidate
} from './testPlaylist'
import
{ addTrackAndValidate,
  deleteTrackAndValidate,
  updateTrack,
  addTrackRepostAndValidate,
  deleteTrackRepostAndValidate,
  addTrackSaveAndValidate,
  deleteTrackSaveAndValidate
} from './testTrack'
import { addUserAndValidate,
  updateUserNameAndValidate,
  markUserVerifiedAndValidate,
  addUserFollowAndValidate,
  deleteUserFollowAndValidate
} from './testUser'

export {
  unregisterContractAndValidate,
  assertNoContractExists,
  addPlaylistAndValidate,
  updatePlaylistPrivacyAndValidate,
  orderPlaylistTracksAndValidate,
  updatePlaylistNameAndValidate,
  updatePlaylistCoverPhotoAndValidate,
  updatePlaylistUPCAndValidate,
  updatePlaylistDescriptionAndValidate,
  addPlaylistRepostAndValidate,
  deletePlaylistRepostAndValidate,
  addPlaylistTrack,
  deletePlaylistTrack,
  addPlaylistSaveAndValidate,
  deletePlaylistSaveAndValidate,
  deletePlaylistAndValidate,
  addTrackAndValidate,
  deleteTrackAndValidate,
  updateTrack,
  addTrackRepostAndValidate,
  deleteTrackRepostAndValidate,
  addTrackSaveAndValidate,
  deleteTrackSaveAndValidate,
  addUserAndValidate,
  updateUserNameAndValidate,
  markUserVerifiedAndValidate,
  addUserFollowAndValidate,
  deleteUserFollowAndValidate
}
