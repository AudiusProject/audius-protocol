import { DiscoveryNodeSelector, sdk, stagingConfig } from "@audius/sdk";
import { UploadTrackRequest } from "@audius/sdk";
import express from "express";
import multer from "multer";
import { signTypedData } from "eth-sig-util";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(express.urlencoded());
const port = 3000;

// Test/develop sdk functionality here

// Local priavte
const privateKey = new Uint8Array([
  126, 19, 187, 141, 171, 78, 83, 59, 39, 220, 234, 104, 57, 28, 53, 4, 148,
  168, 225, 58, 116, 19, 11, 93, 234, 207, 97, 114, 139, 76, 180, 134,
]);

const audiusSdk = sdk({
  appName: "sdk-consumer",
  services: {
    discoveryNodeSelector: new DiscoveryNodeSelector({
      bootstrapServices: stagingConfig.discoveryNodes,
    }),
    // TODO: update walletApi to support apiKey and apiSecret
    // TODO: Fix types here, add signTypedData?
    walletApi: {
      sign: async (data: string) => {
        return signTypedData(privateKey as Buffer, {
          data,
        }) as any;
        // return await secp.sign(keccak_256(data), privateKey, {
        //   recovered: true,
        //   der: false,
        // });
      },
      getSharedSecret: async (publicKey: string | Uint8Array) =>
        new Uint8Array(),
      getAddress: async () => "0x3a4105285fecb3978291e981d109e8b4d7272a98",
    },
  },
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
        const uploadTrackRequest: UploadTrackRequest = {
          artistId: req.body.artistId,
          coverArtFile: {
            buffer: coverArtFile?.buffer,
            name: coverArtFile.originalname,
          },
          metadata: JSON.parse(req.body.metadata),
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
      console.log(e);
      res.send((e as any).message);
    }
  }
);
