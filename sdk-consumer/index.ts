import {
  DiscoveryNodeSelector,
  EntityManager,
  RepostTrackRequest,
  SaveTrackRequest,
  sdk,
  UnrepostTrackRequest,
  UnsaveTrackRequest,
  UpdateTrackRequest,
  FollowUserRequest,
  UnfollowUserRequest,
  UploadTrackRequest,
  DeleteTrackRequest,
  developmentConfig,
  SubscribeToUserRequest,
  UnsubscribeFromUserRequest,
  RepostPlaylistRequest,
  SavePlaylistRequest,
  UnrepostPlaylistRequest,
  UnsavePlaylistRequest,
  UploadPlaylistRequest,
  CreatePlaylistRequest,
  PublishPlaylistRequest,
  UpdatePlaylistRequest,
} from "@audius/sdk";
import express from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(express.urlencoded());
const port = 3100;

// Test/develop sdk functionality here

const discoveryNodeSelector = new DiscoveryNodeSelector({
  initialSelectedNode: "http://audius-protocol-discovery-provider-1",
});

const audiusSdk = sdk({
  appName: "sdk-consumer",
  services: {
    discoveryNodeSelector,
    entityManager: new EntityManager({
      discoveryNodeSelector,
      web3ProviderUrl: developmentConfig.web3ProviderUrl,
      contractAddress: developmentConfig.entityManagerContractAddress,
      identityServiceUrl: developmentConfig.identityServiceUrl,
    }),
  },
  apiKey: "",
  apiSecret: "",
});

app.listen(port, () => {
  console.log(`sdk-consumer listening on port ${port}`);
});

const trackUpload = upload.fields([
  { name: "coverArtFile", maxCount: 1 },
  { name: "trackFile", maxCount: 1 },
]);

type MulterFiles =
  | {
      [fieldname: string]: Express.Multer.File[];
    }
  | undefined;

app.post<UploadTrackRequest>(
  "/uploadTrack",
  trackUpload as any,
  async (req, res) => {
    try {
      const coverArtFile = (req.files as MulterFiles)?.["coverArtFile"][0];
      const trackFile = (req.files as MulterFiles)?.["trackFile"][0];

      if (coverArtFile && trackFile) {
        const inputMetadata = JSON.parse(req.body.metadata);
        inputMetadata.releaseDate = inputMetadata.releaseDate
          ? new Date(inputMetadata.releaseDate)
          : inputMetadata.releaseDate;

        const uploadTrackRequest: UploadTrackRequest = {
          userId: req.body.userId,
          coverArtFile: {
            buffer: coverArtFile?.buffer,
            name: coverArtFile.originalname,
          },
          metadata: inputMetadata,
          onProgress: (progress) => console.log("Progress:", progress),
          trackFile: {
            buffer: trackFile?.buffer,
            name: trackFile.originalname,
          },
        };
        const result = await audiusSdk.tracks.uploadTrack(uploadTrackRequest);
        res.send(result);
      }
    } catch (e) {
      console.error(e);
      res.send((e as any).message);
    }
  }
);

const trackUpdate = upload.fields([{ name: "coverArtFile", maxCount: 1 }]);

app.post<UpdateTrackRequest>(
  "/updateTrack",
  trackUpdate as any,
  async (req, res) => {
    try {
      const coverArtFile = (req.files as MulterFiles)?.["coverArtFile"][0];

      if (coverArtFile) {
        const inputMetadata = JSON.parse(req.body.metadata);
        inputMetadata.releaseDate = inputMetadata.releaseDate
          ? new Date(inputMetadata.releaseDate)
          : inputMetadata.releaseDate;

        const updateTrackRequest: any = {
          userId: req.body.userId,
          trackId: req.body.trackId,
          coverArtFile: {
            buffer: coverArtFile?.buffer,
            name: coverArtFile.originalname,
          },
          metadata: inputMetadata,
          onProgress: (progress: any) => console.log("Progress:", progress),
        };
        const result = await audiusSdk.tracks.updateTrack(updateTrackRequest);
        res.send(result);
      }
    } catch (e) {
      console.error(e);
      res.send((e as any).message);
    }
  }
);

app.post<DeleteTrackRequest>("/deleteTrack", async (req, res) => {
  try {
    const deleteTrackRequest: DeleteTrackRequest = {
      userId: req.body.userId,
      trackId: req.body.trackId,
    };
    const result = await audiusSdk.tracks.deleteTrack(deleteTrackRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<SaveTrackRequest>("/saveTrack", async (req, res) => {
  try {
    const saveTrackRequest: SaveTrackRequest = {
      userId: req.body.userId,
      trackId: req.body.trackId,
      metadata: req.body.metadata,
    };
    const result = await audiusSdk.tracks.saveTrack(saveTrackRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<UnsaveTrackRequest>("/unsaveTrack", async (req, res) => {
  try {
    const unsaveTrackRequest: UnsaveTrackRequest = {
      userId: req.body.userId,
      trackId: req.body.trackId,
    };
    const result = await audiusSdk.tracks.unsaveTrack(unsaveTrackRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<RepostTrackRequest>("/repostTrack", async (req, res) => {
  try {
    const repostTrackRequest: RepostTrackRequest = {
      userId: req.body.userId,
      trackId: req.body.trackId,
      metadata: req.body.metadata,
    };
    const result = await audiusSdk.tracks.repostTrack(repostTrackRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<UnrepostTrackRequest>("/unrepostTrack", async (req, res) => {
  try {
    const unrepostTrackRequest: UnrepostTrackRequest = {
      userId: req.body.userId,
      trackId: req.body.trackId,
    };
    const result = await audiusSdk.tracks.unrepostTrack(unrepostTrackRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

const playlistCreation = upload.fields([{ name: "coverArtFile", maxCount: 1 }]);

app.post<CreatePlaylistRequest>(
  "/createPlaylist",
  playlistCreation as any,
  async (req, res) => {
    try {
      const coverArtFile = (req.files as MulterFiles)?.["coverArtFile"][0];

      if (coverArtFile) {
        const inputMetadata = JSON.parse(req.body.metadata);

        const createPlaylistRequest: CreatePlaylistRequest = {
          userId: req.body.userId,
          coverArtFile: {
            buffer: coverArtFile?.buffer,
            name: coverArtFile.originalname,
          },
          metadata: inputMetadata,
          trackIds: JSON.parse(req.body.trackIds),
          onProgress: (progress) => console.log("Progress:", progress),
        };
        const result = await audiusSdk.playlists.createPlaylist(
          createPlaylistRequest
        );
        res.send(result);
      }
    } catch (e) {
      console.error(e);
      res.send((e as any).message);
    }
  }
);

const playlistUpload = upload.fields([
  { name: "coverArtFile", maxCount: 1 },
  { name: "trackFiles" },
]);

app.post<UploadPlaylistRequest>(
  "/uploadPlaylist",
  playlistUpload as any,
  async (req, res) => {
    try {
      const coverArtFile = (req.files as MulterFiles)?.["coverArtFile"][0];
      const trackFiles = (req.files as MulterFiles)?.["trackFiles"];

      if (coverArtFile && trackFiles?.length) {
        const inputMetadata = JSON.parse(req.body.metadata);
        inputMetadata.releaseDate = inputMetadata.releaseDate
          ? new Date(inputMetadata.releaseDate)
          : inputMetadata.releaseDate;

        const inputTrackMetadatas = JSON.parse(req.body.trackMetadatas);

        const uploadPlaylistRequest: UploadPlaylistRequest = {
          userId: req.body.userId,
          coverArtFile: {
            buffer: coverArtFile?.buffer,
            name: coverArtFile.originalname,
          },
          metadata: inputMetadata,
          onProgress: (progress) => console.log("Progress:", progress),
          trackMetadatas: inputTrackMetadatas,
          trackFiles: trackFiles.map((trackFile) => ({
            buffer: trackFile?.buffer,
            name: trackFile.originalname,
          })),
        };
        const result = await audiusSdk.playlists.uploadPlaylist(
          uploadPlaylistRequest
        );
        res.send(result);
      }
    } catch (e) {
      console.error(e);
      res.send((e as any).message);
    }
  }
);

const playlistUpdate = upload.fields([{ name: "coverArtFile", maxCount: 1 }]);

app.post<UpdatePlaylistRequest>(
  "/updatePlaylist",
  playlistUpdate as any,
  async (req, res) => {
    try {
      const coverArtFile = (req.files as MulterFiles)?.["coverArtFile"][0];

      const inputMetadata = JSON.parse(req.body.metadata);
      inputMetadata.releaseDate = inputMetadata.releaseDate
        ? new Date(inputMetadata.releaseDate)
        : inputMetadata.releaseDate;

      const updatePlaylistRequest: UpdatePlaylistRequest = {
        userId: req.body.userId,
        playlistId: req.body.playlistId,
        coverArtFile: coverArtFile && {
          buffer: coverArtFile?.buffer,
          name: coverArtFile.originalname,
        },
        metadata: inputMetadata,
        onProgress: (progress) => console.log("Progress:", progress),
      };
      const result = await audiusSdk.playlists.updatePlaylist(
        updatePlaylistRequest
      );
      res.send(result);
    } catch (e) {
      console.error(e);
      res.send((e as any).message);
    }
  }
);

app.post<PublishPlaylistRequest>("/publishPlaylist", async (req, res) => {
  try {
    const publishPlaylistRequest: PublishPlaylistRequest = {
      userId: req.body.userId,
      playlistId: req.body.playlistId,
    };
    const result = await audiusSdk.playlists.publishPlaylist(
      publishPlaylistRequest
    );
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<RepostPlaylistRequest>("/deletePlaylist", async (req, res) => {
  try {
    const deletePlaylistRequest: RepostPlaylistRequest = {
      userId: req.body.userId,
      playlistId: req.body.trackId,
    };
    const result = await audiusSdk.playlists.deletePlaylist(
      deletePlaylistRequest
    );
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<SavePlaylistRequest>("/savePlaylist", async (req, res) => {
  try {
    const savePlaylistRequest: SavePlaylistRequest = {
      userId: req.body.userId,
      playlistId: req.body.playlistId,
      metadata: req.body.metadata,
    };
    const result = await audiusSdk.playlists.savePlaylist(savePlaylistRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<UnsavePlaylistRequest>("/unsavePlaylist", async (req, res) => {
  try {
    const unsavePlaylistRequest: UnsavePlaylistRequest = {
      userId: req.body.userId,
      playlistId: req.body.playlistId,
    };
    const result = await audiusSdk.playlists.unsavePlaylist(
      unsavePlaylistRequest
    );
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<RepostPlaylistRequest>("/repostPlaylist", async (req, res) => {
  try {
    const repostPlaylistRequest: RepostPlaylistRequest = {
      userId: req.body.userId,
      playlistId: req.body.playlistId,
      metadata: req.body.metadata,
    };
    const result = await audiusSdk.playlists.repostPlaylist(
      repostPlaylistRequest
    );
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<UnrepostPlaylistRequest>("/unrepostPlaylist", async (req, res) => {
  try {
    const unrepostPlaylistRequest: UnrepostPlaylistRequest = {
      userId: req.body.userId,
      playlistId: req.body.playlistId,
    };
    const result = await audiusSdk.playlists.unrepostPlaylist(
      unrepostPlaylistRequest
    );
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<FollowUserRequest>("/followUser", async (req, res) => {
  try {
    const followUserRequest: FollowUserRequest = {
      userId: req.body.userId,
      followeeUserId: req.body.followeeUserId,
    };
    const result = await audiusSdk.users.followUser(followUserRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<UnfollowUserRequest>("/unfollowUser", async (req, res) => {
  try {
    const unfollowUserRequest: UnfollowUserRequest = {
      userId: req.body.userId,
      followeeUserId: req.body.followeeUserId,
    };
    const result = await audiusSdk.users.unfollowUser(unfollowUserRequest);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<SubscribeToUserRequest>("/subscribeToUser", async (req, res) => {
  try {
    const subscribeToUserRequest: SubscribeToUserRequest = {
      userId: req.body.userId,
      subscribeeUserId: req.body.subscribeeUserId,
    };
    const result = await audiusSdk.users.subscribeToUser(
      subscribeToUserRequest
    );
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send((e as any).message);
  }
});

app.post<UnsubscribeFromUserRequest>(
  "/unsubscribeFromUser",
  async (req, res) => {
    try {
      const unsubscribeFromUserRequest: UnsubscribeFromUserRequest = {
        userId: req.body.userId,
        subscribeeUserId: req.body.subscribeeUserId,
      };
      const result = await audiusSdk.users.unsubscribeFromUser(
        unsubscribeFromUserRequest
      );
      res.send(result);
    } catch (e) {
      console.error(e);
      res.send((e as any).message);
    }
  }
);
