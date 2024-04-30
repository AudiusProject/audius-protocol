import {
  AudiusSdk,
  Genre,
  UploadAlbumRequest,
  UploadTrackRequest,
} from '@audius/sdk'
import {
  ReleaseProcessingStatus,
  ReleaseRow,
  dbUpdate,
  releaseRepo,
} from './db'
import { DDEXContributor, DDEXRelease, DDEXResource } from './parseDelivery'
import { readAssetWithCaching } from './s3poller'
import { createSdkService } from './sdk'

export const sdkService = createSdkService()

export async function publishValidPendingReleases(opts?: {
  republish: boolean
}) {
  const rows = releaseRepo.all({ pendingPublish: true })
  if (!rows.length) return

  const sdk = (await sdkService).getSdk()

  for (const row of rows) {
    const parsed = row._parsed!

    // todo: hardcoding to my staging user ID to make e2e publish easier
    // todo: remove
    parsed.audiusUser = 'KKa311z'

    if (row.entityId) {
      // todo: need better state tracking for updates
      // simplest way... if parsedJson != publishedJson issue update
      //    the risk being that this might incite a ton of needless updates if not careful
      // could do... if xmlUrl != publishedXmlUrl
      //    but that wouldn't handle code change type of thing

      // for now, update all published releases when `republish` flag is set vai:
      //   npx tsx cli publish --republish

      if (opts?.republish) {
        if (row.entityType == 'track') {
          await updateTrack(sdk, row, parsed)
        } else if (row.entityType == 'album') {
          await updateAlbum(sdk, row, parsed)
        } else {
          console.log('unknown entity type', row.entityType)
        }
      }

      releaseRepo.update({
        key: row.key,
        status: ReleaseProcessingStatus.Published,
      })
    } else {
      // publish new release
      try {
        await publishRelease(sdk, row, parsed)
      } catch (e: any) {
        console.log('failed to publish', row.key, e)
        releaseRepo.addPublishError(row.key, e)
      }
    }
  }
}

export async function publishRelease(
  sdk: AudiusSdk,
  releaseRow: ReleaseRow,
  release: DDEXRelease
) {
  if (new Date(release.releaseDate) > new Date()) {
    console.log(
      `Skipping future release: ${releaseRow.key} ${release.releaseDate}`
    )
    return
  }

  const skipSdkPublish = process.env.SKIP_SDK_PUBLISH == 'true'

  if (!releaseRow.xmlUrl) {
    throw new Error(`xmlUrl is required to resolve file paths`)
  }

  // read asset file
  async function resolveFile({ filePath, fileName }: DDEXResource) {
    return readAssetWithCaching(releaseRow.xmlUrl, filePath, fileName)
  }

  const imageFile = await resolveFile(release.images[0])

  const trackFiles = await Promise.all(
    release.soundRecordings.map((track) => resolveFile(track))
  )

  const trackMetadatas = prepareTrackMetadatas(release)

  // publish album
  if (release.soundRecordings.length > 1) {
    const uploadAlbumRequest: UploadAlbumRequest = {
      coverArtFile: imageFile,
      metadata: prepareAlbumMetadata(release),
      trackFiles,
      trackMetadatas,
      userId: release.audiusUser!,
    }

    if (skipSdkPublish) {
      console.log('skipping sdk publish')
      return
    }

    const result = await sdk.albums.uploadAlbum(uploadAlbumRequest)
    console.log(result)

    // on success set publishedAt, entityId, blockhash
    dbUpdate('releases', 'key', {
      key: releaseRow.key,
      status: 'Published',
      entityType: 'album',
      entityId: result.albumId,
      blockNumber: result.blockNumber,
      blockHash: result.blockHash,
      publishedAt: new Date().toISOString(),
    })

    // return result
  } else if (trackFiles[0]) {
    // publish track

    const metadata = trackMetadatas[0]
    const trackFile = trackFiles[0]

    metadata.ddexReleaseIds = release.releaseIds

    const uploadTrackRequest: UploadTrackRequest = {
      userId: release.audiusUser!,
      metadata,
      coverArtFile: imageFile,
      trackFile,
    }

    if (skipSdkPublish) {
      console.log('skipping sdk publish')
      return
    }

    const result = await sdk.tracks.uploadTrack(uploadTrackRequest)
    console.log(result)

    // on succes: update releases
    releaseRepo.update({
      key: releaseRow.key,
      status: ReleaseProcessingStatus.Published,
      entityType: 'track',
      entityId: result.trackId!,
      blockNumber: result.blockNumber,
      blockHash: result.blockHash,
      publishedAt: new Date().toISOString(),
    })
  }
}

async function updateTrack(
  sdk: AudiusSdk,
  row: ReleaseRow,
  release: DDEXRelease
) {
  const metas = prepareTrackMetadatas(release)

  const result = await sdk.tracks.updateTrack({
    userId: release.audiusUser!,
    trackId: row.entityId!,
    metadata: metas[0],
  })

  console.log('update track', result)
  // todo: record update to db
}

export function prepareTrackMetadatas(release: DDEXRelease) {
  const trackMetas: UploadTrackRequest['metadata'][] =
    release.soundRecordings.map((sound) => {
      const audiusGenre = sound.audiusGenre || release.audiusGenre || Genre.ALL

      const releaseDate =
        new Date(sound.releaseDate) ||
        new Date(release.releaseDate) ||
        new Date()

      // use sound copyright, fallback to release copyright
      const copyrightLine = sound.copyrightLine || release.copyrightLine
      const producerCopyrightLine =
        sound.producerCopyrightLine || release.producerCopyrightLine
      const parentalWarningType =
        sound.parentalWarningType || release.parentalWarningType

      const meta: UploadTrackRequest['metadata'] = {
        genre: audiusGenre,
        title: sound.title,
        isrc: release.isrc,
        releaseDate,
        copyrightLine,
        producerCopyrightLine,
        parentalWarningType,
        rightsController: sound.rightsController,
        artists: sound.artists.map(mapContributor),
        resourceContributors: sound.contributors.map(mapContributor),
        indirectResourceContributors:
          sound.indirectContributors.map(mapContributor),
      }

      return meta
    })

  return trackMetas
}

//
// Album
//

async function updateAlbum(
  sdk: AudiusSdk,
  row: ReleaseRow,
  release: DDEXRelease
) {
  const meta = prepareAlbumMetadata(release)

  const result = await sdk.albums.updateAlbum({
    userId: release.audiusUser!,
    albumId: row.entityId!,
    metadata: meta,
  })

  console.log('UPDATE ALBUM', result)
  // todo: record update to db blocknumber / blockhash
}

export async function deleteRelease(sdk: AudiusSdk, r: ReleaseRow) {
  const userId = r._parsed!.audiusUser!
  // const userId = 'KKa311z'
  const entityId = r.entityId

  if (!userId || !entityId) {
    console.log('no entityType for release ${r.key}')
    return
  }

  if (r.entityType == 'track') {
    const result = await sdk.tracks.deleteTrack({
      trackId: entityId,
      userId,
    })

    releaseRepo.update({
      key: r.key,
      status: ReleaseProcessingStatus.Deleted,
      // update blockhash / blockno?
    })
    console.log('deleted track', result)
    return result
  } else if (r.entityType == 'album') {
    const result = await sdk.albums.deleteAlbum({
      albumId: entityId,
      userId,
    })

    releaseRepo.update({
      key: r.key,
      status: ReleaseProcessingStatus.Deleted,
      // update blockhash / blockno?
    })
    console.log('deleted album', result)
    return result
  }
}

export function prepareAlbumMetadata(release: DDEXRelease) {
  let releaseDate: Date | undefined
  if (release.releaseDate) {
    releaseDate = new Date(release.releaseDate)
  }
  const meta: UploadAlbumRequest['metadata'] = {
    genre: release.audiusGenre || Genre.ALL,
    albumName: release.title,
    releaseDate,
    ddexReleaseIds: release.releaseIds,
    artists: release.artists.map(mapContributor),
  }
  return meta
}

function mapContributor(c: DDEXContributor) {
  return {
    name: c.name,
    roles: [c.role!], // todo: does ddex xml have multiple roles for a contributor?
  }
}
