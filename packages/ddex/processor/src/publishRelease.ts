import {
  AudiusSdk,
  Genre,
  UploadAlbumRequest,
  UploadTrackRequest,
} from '@audius/sdk'
import { ReleaseProcessingStatus, ReleaseRow, releaseRepo } from './db'
import { DDEXContributor, DDEXRelease, DDEXResource } from './parseDelivery'
import { readAssetWithCaching } from './s3poller'
import { getSdk } from './sdk'
import { SourceConfig, sources } from './sources'

export async function publishValidPendingReleases() {
  const rows = releaseRepo.all({ pendingPublish: true })
  if (!rows.length) return

  for (const row of rows) {
    const source = sources.findByName(row.source)
    const sdk = getSdk(source)
    const parsed = row._parsed!

    if (row.status == ReleaseProcessingStatus.DeletePending) {
      // delete
      deleteRelease(sdk, row)
    } else if (row.entityId) {
      // update
      if (row.entityType == 'track') {
        await updateTrack(sdk, row, parsed)
      } else if (row.entityType == 'album') {
        await updateAlbum(sdk, row, parsed)
      } else {
        console.log('unknown entity type', row.entityType)
      }
    } else {
      // create
      try {
        await publishRelease(source, sdk, row, parsed)
      } catch (e: any) {
        console.log('failed to publish', row.key, e)
        releaseRepo.addPublishError(row.key, e)
      }
    }
  }
}

export async function publishRelease(
  source: SourceConfig,
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

  if (source.placementHosts) {
    for (const t of trackMetadatas) {
      t.placementHosts = source.placementHosts
    }
  }

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
    releaseRepo.update({
      key: releaseRow.key,
      status: ReleaseProcessingStatus.Published,
      entityType: 'album',
      entityId: result.albumId!,
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

  releaseRepo.update({
    key: row.key,
    status: ReleaseProcessingStatus.Published,
    publishedAt: new Date().toISOString(),
    ...result,
  })

  return result
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
        isrc: release.releaseIds.isrc,
        iswc: release.releaseIds.iswc,
        ddexReleaseIds: release.releaseIds,
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

      for (const deal of release.deals) {
        if (deal.audiusDealType == 'FollowGated') {
          const cond = { followUserId: release.audiusUser! }
          if (deal.forStream) {
            meta.isStreamGated = true
            meta.streamConditions = cond
          }
          if (deal.forDownload) {
            meta.isDownloadGated = true
            meta.downloadConditions = cond
          }
        }

        if (deal.audiusDealType == 'TipGated') {
          const cond = { tipUserId: release.audiusUser! }
          if (deal.forStream) {
            meta.isStreamGated = true
            meta.streamConditions = cond
          }
          if (deal.forDownload) {
            meta.isDownloadGated = true
            meta.downloadConditions = cond
          }
        }

        if (deal.audiusDealType == 'PayGated') {
          const cond = {
            usdcPurchase: {
              price: deal.priceUsd,
            },
          }
          if (deal.forStream) {
            meta.isStreamGated = true
            meta.streamConditions = cond
          }
          if (deal.forDownload) {
            meta.isDownloadGated = true
            meta.downloadConditions = cond
          }
        }
      }

      // todo: nft gated types

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

  releaseRepo.update({
    key: row.key,
    status: ReleaseProcessingStatus.Published,
    publishedAt: new Date().toISOString(),
    ...result,
  })

  return result
}

export async function deleteRelease(sdk: AudiusSdk, r: ReleaseRow) {
  const userId = r._parsed!.audiusUser!
  const entityId = r.entityId

  // if not yet published to audius, mark internal releases row as deleted
  if (!userId || !entityId) {
    releaseRepo.update({
      key: r.key,
      status: ReleaseProcessingStatus.Deleted,
    })
    return
  }

  if (r.entityType == 'track') {
    const result = await sdk.tracks.deleteTrack({
      trackId: entityId,
      userId,
    })
    return onDeleted(result)
  } else if (r.entityType == 'album') {
    const result = await sdk.albums.deleteAlbum({
      albumId: entityId,
      userId,
    })
    return onDeleted(result)
  }

  function onDeleted(result: any) {
    releaseRepo.update({
      key: r.key,
      status: ReleaseProcessingStatus.Deleted,
      publishedAt: new Date().toISOString(),
      ...result,
    })
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
    upc: release.releaseIds.icpn, // ICPN is either UPC (USA/Canada) or EAN (rest of world), but we call them both UPC
    parentalWarningType: release.parentalWarningType,
    copyrightLine: release.copyrightLine,
    producerCopyrightLine: release.producerCopyrightLine,
  }

  // todo: album stream + download conditions

  return meta
}

function mapContributor(c: DDEXContributor) {
  return {
    name: c.name,
    roles: [c.role!], // todo: does ddex xml have multiple roles for a contributor?
  }
}
