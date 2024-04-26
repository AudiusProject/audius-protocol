package main

import (
	"context"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func setupEnv(i *common.Ingester) error {
	if err := createBucket(i.S3Client, i.Bucket); err != nil && !strings.HasPrefix(err.Error(), "bucket exists") {
		return err
	}
	fmt.Printf("Created buckets: %s, %s\n", i.Bucket, i.Bucket)

	users := i.MongoClient.Database("ddex").Collection("users")
	_, err := users.InsertOne(i.Ctx, bson.M{
		"_id":             "Bmv3bJ",
		"decodedUserId":   "130821286",
		"handle":          "theo_random",
		"email":           "theo+random@audius.co",
		"name":            "Theo Random",
		"verified":        false,
		"profile_picture": nil,
		"is_admin":        false,
	})
	if err != nil {
		return fmt.Errorf("failed to insert user into Mongo: %v", err)
	}

	_, err = users.InsertOne(i.Ctx, bson.M{
		"_id":             "abcdef",
		"decodedUserId":   "12345",
		"handle":          "Monkey Claw",
		"email":           "monkey_claw@cpd.com",
		"name":            "Monkey Claw",
		"verified":        false,
		"profile_picture": nil,
		"is_admin":        false,
	})
	if err != nil {
		return fmt.Errorf("failed to insert user into Mongo: %v", err)
	}

	_, err = users.InsertOne(i.Ctx, bson.M{
		"_id":             "zyxwvu",
		"decodedUserId":   "98765",
		"handle":          "2pec_shakur",
		"email":           "2pec.shakur@fuga.com",
		"name":            "2pec Shakur",
		"verified":        false,
		"profile_picture": nil,
		"is_admin":        false,
	})
	if err != nil {
		return fmt.Errorf("failed to insert user into Mongo: %v", err)
	}

	_, err = users.InsertOne(i.Ctx, bson.M{
		"_id":             "fugarian",
		"decodedUserId":   "111111",
		"handle":          "fugarian",
		"email":           "2pec.shakur@fuga.com",
		"name":            "FUGARIAN",
		"verified":        false,
		"profile_picture": nil,
		"is_admin":        false,
	})
	if err != nil {
		return fmt.Errorf("failed to insert user into Mongo: %v", err)
	}

	return nil
}

func TestRunE2E(t *testing.T) {
	i := common.NewIngester(context.Background())
	defer i.MongoClient.Disconnect(i.Ctx)

	err := setupEnv(i)
	if err != nil {
		t.Fatalf("Failed to set up test environment: %v", err)
	}

	type subTest struct {
		path            string
		expectedBatch   *common.Batch
		expectedRelease common.Release
	}

	releaseByReleaseTests := []subTest{
		{
			path: "release_by_release/ern381/sony1.zip",
			expectedRelease: common.Release{
				ReleaseID:      "A10301A0005108088N",
				XMLRemotePath:  "s3://audius-test-raw/A10301A0005108088N/A10301A0005108088N.xml",
				PublishErrors:  []string{},
				ReleaseProfile: common.UnspecifiedReleaseProfile,
				ReleaseStatus:  constants.ReleaseStatusAwaitingPublish,
				SDKUploadMetadata: common.SDKUploadMetadata{
					ReleaseDate:       time.Date(2023, time.September, 1, 0, 0, 0, 0, time.UTC),
					ValidityStartDate: time.Date(2023, time.September, 2, 0, 0, 0, 0, time.UTC),
					Genre:             "Hip-Hop/Rap",
					Artists: []common.ResourceContributor{
						{
							Name:           "Theo Random",
							Roles:          []string{"MainArtist"},
							SequenceNumber: 1,
						},
					},
					Description: nil,
					DDEXReleaseIDs: &common.ReleaseIDs{
						CatalogNumber: "G010005108088N",
						ICPN:          "196871335584",
						GRid:          "A10301A0005108088N",
					},
					Mood:          nil,
					Tags:          nil,
					CopyrightLine: nil,
					ProducerCopyrightLine: &common.Copyright{
						Year: "2023",
						Text: "(P) 2023 South Africa - Sony Music Entertainment Africa (Pty) Ltd, under Sound African Recordings a division of Sony Music Entertainment Africa (Pty) Ltd",
					},
					ParentalWarningType:          stringPtr("Explicit"),
					License:                      nil,
					CoverArtURL:                  "s3://audius-test-raw/A10301A0005108088N/resources/A10301A0005108088N_T-1027024165547_Image.jpg",
					CoverArtURLHash:              stringPtr("582fb410615167205e8741580cf77e71"),
					CoverArtURLHashAlgo:          stringPtr("MD5"),
					Title:                        nil,
					Duration:                     0,
					PreviewStartSeconds:          nil,
					ISRC:                         nil,
					ResourceContributors:         nil,
					IndirectResourceContributors: nil,
					RightsController:             nil,
					PreviewAudioFileURL:          nil,
					PreviewAudioFileURLHash:      nil,
					PreviewAudioFileURLHashAlgo:  nil,
					AudioFileURL:                 nil,
					AudioFileURLHash:             nil,
					AudioFileURLHashAlgo:         nil,

					PlaylistName:      stringPtr("Present."),
					PlaylistOwnerID:   stringPtr("Bmv3bJ"),
					PlaylistOwnerName: stringPtr("Theo Random"),
					IsAlbum:           boolPtr(true),
					IsPrivate:         nil,
					UPC:               stringPtr("196871335584"),
					HasDeal:           true,
					Tracks: []common.TrackMetadata{
						{
							Title:             "Playing With Fire.",
							ReleaseDate:       time.Date(2023, time.September, 1, 0, 0, 0, 0, time.UTC),
							ValidityStartDate: time.Date(2023, time.September, 2, 0, 0, 0, 0, time.UTC),
							Genre:             "Hip-Hop/Rap",
							Duration:          279,
							ISRC:              stringPtr("ZAA012300131"),
							DDEXReleaseIDs: common.ReleaseIDs{
								ISRC: "ZAA012300131",
							},
							ArtistID: "Bmv3bJ",
							Artists: []common.ResourceContributor{
								{
									Name:           "Theo Random",
									Roles:          []string{"AssociatedPerformer", "MainArtist"},
									SequenceNumber: 1,
								},
							},
							ProducerCopyrightLine: &common.Copyright{
								Year: "2023",
								Text: "(P) 2023 South Africa - Sony Music Entertainment Africa (Pty) Ltd, under Sound African Recordings a division of Sony Music Entertainment Africa (Pty) Ltd",
							},
							ResourceContributors: []common.ResourceContributor{
								{Name: "Thabiso Moya", Roles: []string{"Composer", "Lyricist"}, SequenceNumber: 1},
								{Name: "Melange", Roles: []string{"Producer"}, SequenceNumber: 2},
								{Name: "Neo Ndungane", Roles: []string{"Composer", "Lyricist"}, SequenceNumber: 3},
								{Name: "Feziekk", Roles: []string{"Producer"}, SequenceNumber: 4},
								{Name: "Regaugetsue Refenyeditswe Leshabane", Roles: []string{"Composer", "Lyricist"}, SequenceNumber: 5},
								{Name: "Gabe Archibald Horowitz", Roles: []string{"Composer", "Lyricist"}, SequenceNumber: 6},
							},
							ParentalWarningType:  stringPtr("Explicit"),
							AudioFileURL:         "s3://audius-test-raw/A10301A0005108088N/resources/A10301A0005108088N_T-1096524256352_SoundRecording_001-001.mp3",
							AudioFileURLHash:     "8bb2ce119257314a8fcb215a49f14b33",
							AudioFileURLHashAlgo: "MD5",
							PreviewAudioFileURL:  "s3://audius-test-raw/A10301A0005108088N/", // TODO: This doesn't seem right...
							PreviewStartSeconds:  intPtr(48),
							ArtistName:           "Theo Random",
							IsStreamGated:        false,
							IsDownloadGated:      false,
							HasDeal:              true,
						},
						{
							Title:             "No Comment.",
							ReleaseDate:       time.Date(2023, time.July, 27, 0, 0, 0, 0, time.UTC),
							ValidityStartDate: time.Date(2023, time.September, 2, 0, 0, 0, 0, time.UTC),
							Genre:             "Hip-Hop/Rap",
							Duration:          142,
							ISRC:              stringPtr("ZAA012300128"),
							DDEXReleaseIDs: common.ReleaseIDs{
								ISRC: "ZAA012300128",
							},
							ArtistID: "Bmv3bJ",
							Artists: []common.ResourceContributor{
								{Name: "Theo Random", Roles: []string{"AssociatedPerformer", "MainArtist"}, SequenceNumber: 1},
								{Name: "Thato Saul", Roles: []string{"AssociatedPerformer", "MainArtist"}, SequenceNumber: 2},
							},
							ProducerCopyrightLine: &common.Copyright{
								Year: "2023",
								Text: "(P) 2023 South Africa - Sony Music Entertainment Africa (Pty) Ltd, under Sound African Recordings a division of Sony Music Entertainment Africa (Pty) Ltd",
							},
							ResourceContributors: []common.ResourceContributor{
								{Name: "Theo Random & Thato Saul", Roles: []string{"AssociatedPerformer"}, SequenceNumber: 1},
								{Name: "Thabiso Moya", Roles: []string{"Composer", "Lyricist"}, SequenceNumber: 2},
								{Name: "Melange", Roles: []string{"Producer"}, SequenceNumber: 3},
								{Name: "Thato Matlebyane", Roles: []string{"Composer", "Lyricist"}, SequenceNumber: 4},
								{Name: "Neo Ndungane", Roles: []string{"Composer", "Lyricist"}, SequenceNumber: 5},
							},
							ParentalWarningType:  stringPtr("Explicit"),
							AudioFileURL:         "s3://audius-test-raw/A10301A0005108088N/resources/A10301A0005108088N_T-1096524142976_SoundRecording_001-002.mp3",
							AudioFileURLHash:     "1e9183898a4f6b45f895e45cd18ba162",
							AudioFileURLHashAlgo: "MD5",
							PreviewAudioFileURL:  "s3://audius-test-raw/A10301A0005108088N/", // TODO: This doesn't seem right...
							PreviewStartSeconds:  intPtr(48),
							ArtistName:           "Theo Random & Thato Saul",
							IsStreamGated:        false,
							IsDownloadGated:      false,
							HasDeal:              true,
						},
					},
				},
			},
		},
	}

	batchedTests := []subTest{
		{
			path: "batch/ern382/1_CPD1.zip",
			expectedBatch: &common.Batch{
				BatchID:     "20161024145603121",
				DDEXSchema:  "382",
				NumMessages: 1,
			},
			expectedRelease: common.Release{
				ReleaseID:      "721620118165",
				BatchID:        "20161024145603121",
				XMLRemotePath:  "s3://audius-test-raw/20161024145603121/721620118165/721620118165.xml",
				PublishErrors:  []string{},
				ReleaseProfile: common.Common14AudioAlbumMusicOnly,
				ReleaseStatus:  constants.ReleaseStatusAwaitingPublish,
				SDKUploadMetadata: common.SDKUploadMetadata{
					ReleaseDate:       time.Date(2010, time.January, 1, 0, 0, 0, 0, time.UTC),
					ValidityStartDate: time.Date(2018, time.January, 10, 0, 0, 0, 0, time.UTC),
					PlaylistName:      stringPtr("A Monkey Claw in a Velvet Glove"),
					PlaylistOwnerID:   stringPtr("abcdef"),
					PlaylistOwnerName: stringPtr("Monkey Claw"),
					Genre:             "Metal",
					IsAlbum:           boolPtr(true),
					DDEXReleaseIDs: &common.ReleaseIDs{
						ICPN: "721620118165",
					},
					UPC: stringPtr("721620118165"),
					CopyrightLine: &common.Copyright{
						Year: "2010",
						Text: "(C) 2010 Iron Crown Music",
					},
					ProducerCopyrightLine: &common.Copyright{
						Year: "2010",
						Text: "(P) 2010 Iron Crown Music",
					},
					ParentalWarningType: stringPtr("NotExplicit"),
					Artists: []common.ResourceContributor{
						{
							Name:           "Monkey Claw",
							Roles:          []string{"MainArtist"},
							SequenceNumber: 1,
						},
					},
					CoverArtURL: "s3://audius-test-raw/20161024145603121/721620118165/resources/721620118165_T7_007.jpg",
					Tracks: []common.TrackMetadata{
						{
							Title:             "Can you feel ...the Monkey Claw!",
							ArtistName:        "Monkey Claw",
							ReleaseDate:       time.Date(2010, time.January, 1, 0, 0, 0, 0, time.UTC),
							ValidityStartDate: time.Date(2018, time.January, 10, 0, 0, 0, 0, time.UTC),
							Genre:             "Metal",
							Duration:          811,
							ISRC:              stringPtr("CASE00000001"),
							DDEXReleaseIDs: common.ReleaseIDs{
								ISRC: "CASE00000001",
							},
							CopyrightLine: &common.Copyright{
								Year: "2010",
								Text: "(C) 2010 Iron Crown Music",
							},
							ProducerCopyrightLine: &common.Copyright{
								Year: "2010",
								Text: "(P) 2010 Iron Crown Music",
							},
							ParentalWarningType: stringPtr("NotExplicit"),
							ResourceContributors: []common.ResourceContributor{
								{
									Name:           "Steve Albino",
									Roles:          []string{"Producer"},
									SequenceNumber: 1,
								},
							},
							IndirectResourceContributors: []common.ResourceContributor{
								{
									Name:           "Bob Black",
									Roles:          []string{"Composer"},
									SequenceNumber: 1,
								},
							},
							ArtistID: "abcdef",
							Artists: []common.ResourceContributor{
								{
									Name:           "Monkey Claw",
									Roles:          []string{"MainArtist"},
									SequenceNumber: 1,
								},
							},
							AudioFileURL:    "s3://audius-test-raw/20161024145603121/721620118165/resources/721620118165_T1_001.wav",
							IsStreamGated:   false,
							IsDownloadGated: false,
							HasDeal:         true,
						},
						{
							Title:             "Red top mountain, blown sky high",
							ArtistName:        "Monkey Claw",
							ReleaseDate:       time.Date(2010, time.January, 1, 0, 0, 0, 0, time.UTC),
							ValidityStartDate: time.Date(2018, time.January, 10, 0, 0, 0, 0, time.UTC),
							Genre:             "Metal",
							Duration:          366,
							ISRC:              stringPtr("CASE00000002"),
							DDEXReleaseIDs: common.ReleaseIDs{
								ISRC: "CASE00000002",
							},
							CopyrightLine: &common.Copyright{
								Year: "2010",
								Text: "(C) 2010 Iron Crown Music",
							},
							ProducerCopyrightLine: &common.Copyright{
								Year: "2010",
								Text: "(P) 2010 Iron Crown Music",
							},
							ParentalWarningType: stringPtr("NotExplicit"),
							ResourceContributors: []common.ResourceContributor{
								{
									Name:           "Steve Albino",
									Roles:          []string{"Producer"},
									SequenceNumber: 1,
								},
							},
							IndirectResourceContributors: []common.ResourceContributor{
								{
									Name:           "Bob Black",
									Roles:          []string{"Composer"},
									SequenceNumber: 1,
								},
							},
							ArtistID: "abcdef",
							Artists: []common.ResourceContributor{
								{
									Name:           "Monkey Claw",
									Roles:          []string{"MainArtist"},
									SequenceNumber: 1,
								},
							},
							AudioFileURL:    "s3://audius-test-raw/20161024145603121/721620118165/resources/721620118165_T2_002.wav",
							IsStreamGated:   false,
							IsDownloadGated: false,
							HasDeal:         true,
						},
					},
				},
			},
		},
		{
			path: "batch/fuga/20240305090206405",
			expectedBatch: &common.Batch{
				BatchID:     "20240305090206405",
				DDEXSchema:  "ern/382",
				NumMessages: 1,
			},
			expectedRelease: common.Release{
				ReleaseID:      "8718857546047",
				BatchID:        "20240305090206405",
				XMLRemotePath:  "s3://audius-test-raw/20240305090206405/8718857546047/8718857546047.xml",
				PublishErrors:  []string{},
				ReleaseProfile: common.Common13AudioSingle,
				ReleaseStatus:  constants.ReleaseStatusAwaitingPublish,
				SDKUploadMetadata: common.SDKUploadMetadata{
					ReleaseDate:       time.Date(2023, time.October, 1, 0, 0, 0, 0, time.UTC),
					ValidityStartDate: time.Date(2023, time.October, 1, 0, 0, 0, 0, time.UTC),
					Genre:             "Blues",
					DDEXReleaseIDs: &common.ReleaseIDs{
						ISRC: "NLRD51952976",
					},
					ArtistID: stringPtr("fugarian"),
					Artists: []common.ResourceContributor{
						{
							Name:           "FUGARIAN",
							Roles:          []string{"MainArtist"},
							SequenceNumber: 1,
						},
					},
					CopyrightLine: &common.Copyright{
						Year: "2021",
						Text: "FUGA Records",
					},
					ProducerCopyrightLine: &common.Copyright{
						Year: "2021",
						Text: "FUGA",
					},
					ParentalWarningType: stringPtr("NotExplicit"),
					CoverArtURL:         "s3://audius-test-raw/20240305090206405/8718857546047/resources/8718857546047_T2_Image.jpg",
					CoverArtURLHash:     stringPtr("03a3372963d1567ef98f7229c49538e0"),
					CoverArtURLHashAlgo: stringPtr("MD5"),
					Title:               stringPtr("All My Single"),
					Duration:            75,
					ISRC:                stringPtr("NLRD51952976"),
					ResourceContributors: []common.ResourceContributor{
						{Name: "Art Tistte", Roles: []string{"Ensemble"}, SequenceNumber: -1},
						{Name: "Albert Zabel", Roles: []string{"Actor"}, SequenceNumber: -1},
						{Name: "Mad Max", Roles: []string{"Remixer"}, SequenceNumber: -1},
					},
					IndirectResourceContributors: []common.ResourceContributor{
						{Name: "Deed Deed", Roles: []string{"MusicPublisher"}, SequenceNumber: -1},
						{Name: "komorebi", Roles: []string{"MusicPublisher"}, SequenceNumber: -1},
						{Name: "Truly Pubz", Roles: []string{"MusicPublisher"}, SequenceNumber: -1},
						{Name: "Adele", Roles: []string{"Translator"}, SequenceNumber: -1},
						{Name: "Albert Zabel", Roles: []string{"Composer"}, SequenceNumber: -1},
					},
					RightsController: &common.RightsController{
						Name:               "Albert Zabel",
						Roles:              []string{"RightsController"},
						RightsShareUnknown: "",
					},
					AudioFileURL:         stringPtr("s3://audius-test-raw/20240305090206405/8718857546047/resources/8718857546047_T1_0_SoundRecording_001_001.flac"),
					AudioFileURLHash:     stringPtr("5e2994cdd94f14a197283a00387ca451"),
					AudioFileURLHashAlgo: stringPtr("5e2994cdd94f14a197283a00387ca451"), // TODO: This isn't right
					Tracks:               nil,
					IsStreamGated:        false,
					IsDownloadGated:      false,
					HasDeal:              true,
				},
			},
		},
	}

	// Run subtests for release-by-release or batched depending on env var

	var subTests []subTest
	choreography := common.MustGetChoreography()
	if choreography == constants.ERNReleaseByRelease {
		subTests = releaseByReleaseTests
	} else if choreography == constants.ERNBatched {
		subTests = batchedTests
	} else {
		t.Fatalf("Unexpected choreography: %s", choreography)
	}

	for _, st := range subTests {
		uploadFixture(t, i, st.path)

		// Verify release
		doc, err := wait2MinsForDoc(i.Ctx, i.ReleasesColl, bson.M{"_id": st.expectedRelease.ReleaseID, "release_status": constants.ReleaseStatusAwaitingPublish})
		if err != nil {
			t.Fatalf("Error finding release for '%s' in Mongo: %v", st.expectedRelease.ReleaseID, err)
		}
		if doc.Err() == mongo.ErrNoDocuments {
			t.Fatalf("No release was found for '%s' in Mongo: %v", st.expectedRelease.ReleaseID, doc.Err())
		}
		var release common.Release
		if err = doc.Decode(&release); err != nil {
			t.Fatalf("Failed to decode release for '%s' from Mongo: %v", st.expectedRelease.ReleaseID, err)
		}

		assert.Equal(t, st.expectedRelease.XMLRemotePath, release.XMLRemotePath, "for release "+release.ReleaseID)
		assert.Equal(t, st.expectedRelease.FailureCount, release.FailureCount, "for release "+release.ReleaseID)
		assert.Equal(t, st.expectedRelease.PublishErrors, release.PublishErrors, "for release "+release.ReleaseID)
		assert.Equal(t, st.expectedRelease.ReleaseStatus, release.ReleaseStatus, "for release "+release.ReleaseID)
		assert.Equal(t, st.expectedRelease.ReleaseProfile, release.ReleaseProfile, "for release "+release.ReleaseID)

		// Compare SDKUploadMetadata without tracks (for cleaner diffing), and then compare tracks after
		expectedTracks, actualTracks := st.expectedRelease.SDKUploadMetadata.Tracks, release.SDKUploadMetadata.Tracks
		st.expectedRelease.SDKUploadMetadata.Tracks = nil
		release.SDKUploadMetadata.Tracks = nil
		assert.Equal(t, st.expectedRelease.SDKUploadMetadata, release.SDKUploadMetadata)
		assert.Equal(t, expectedTracks, actualTracks)

		// Verify batch
		if st.expectedBatch != nil {
			batchDoc, err := wait2MinsForDoc(i.Ctx, i.BatchesColl, bson.M{"_id": st.expectedBatch.BatchID})
			if err != nil {
				t.Fatalf("Error finding batch for '%s' in Mongo: %v", st.expectedBatch.BatchID, err)
			}
			if doc.Err() == mongo.ErrNoDocuments {
				t.Fatalf("No batch was found for '%s' in Mongo: %v", st.expectedBatch.BatchID, doc.Err())
			}
			var batch common.Batch
			if err = batchDoc.Decode(&batch); err != nil {
				t.Fatalf("Failed to decode batch for '%s' from Mongo: %v", st.expectedBatch.BatchID, err)
			}
			assert.Equal(t, st.expectedBatch.DDEXSchema, batch.DDEXSchema, "for batch "+batch.BatchID)
			assert.Equal(t, st.expectedBatch.NumMessages, batch.NumMessages, "for batch "+batch.BatchID)
		}

		// TODO: Leaving the publisher untested for now. No need to do this anymore (at least not fully)
	}
}

func createBucket(s3Client *s3.S3, bucket string) error {
	_, err := s3Client.CreateBucket(&s3.CreateBucketInput{
		Bucket: aws.String(bucket),
		CreateBucketConfiguration: &s3.CreateBucketConfiguration{
			LocationConstraint: aws.String(*s3Client.Config.Region),
		},
	})
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case s3.ErrCodeBucketAlreadyExists:
				return fmt.Errorf("bucket name %s already in use", bucket)
			case s3.ErrCodeBucketAlreadyOwnedByYou:
				return fmt.Errorf("bucket exists %s and is owned by you", bucket)
			default:
				return fmt.Errorf("error creating bucket %s: %v", bucket, err)
			}
		}
	}

	return nil
}

// uploadFixture uploads a test fixture (i.e., folder or ZIP file) to the S3 "raw" bucket
func uploadFixture(t *testing.T, i *common.Ingester, path string) string {
	fullPath := filepath.Join("fixtures", path)
	info, err := os.Stat(fullPath)
	if err != nil {
		t.Fatalf("Error getting file info for '%s': %v", fullPath, err)
	}

	var s3Path string
	if info.IsDir() {
		baseDir := filepath.Base(path) // Now 'baseDir' is 'someFolder' for 'fixtures/myPath/somepath/someFolder'
		s3Path, err = i.UploadDirectory(fullPath, baseDir)
	} else {
		// If it's a ZIP file, upload directly to the root of the S3 bucket
		if strings.HasSuffix(path, ".zip") {
			_, fileName := filepath.Split(path) // Just the file name
			s3Path, err = i.UploadFile(fullPath, "", fileName)
		}
	}
	if err != nil {
		t.Fatalf("Error uploading file or dir '%s': %v", fullPath, err)
	}

	return fmt.Sprintf("s3://%s/%s", i.Bucket, s3Path)
}

func wait2MinsForDoc(ctx context.Context, collection *mongo.Collection, filter bson.M) (*mongo.SingleResult, error) {
	var doc *mongo.SingleResult

	timeoutCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeoutCtx.Done():
			return nil, timeoutCtx.Err() // Context was canceled or timed out
		case <-ticker.C:
			doc = collection.FindOne(timeoutCtx, filter)
			if doc.Err() == nil {
				return doc, nil // Document found
			}
			if doc.Err() != mongo.ErrNoDocuments {
				return nil, doc.Err() // An actual error occurred
			}
		}
	}
}

func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

func boolPtr(b bool) *bool {
	return &b
}
