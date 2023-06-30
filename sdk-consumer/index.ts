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
