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
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func setupEnv(bi *common.BaseIngester) error {
	if err := createBucket(bi.S3Client, bi.RawBucket); err != nil {
		return err
	}
	if err := createBucket(bi.S3Client, bi.CrawledBucket); err != nil {
		return err
	}
	fmt.Printf("Created buckets: %s, %s\n", bi.RawBucket, bi.CrawledBucket)

	users := bi.MongoClient.Database("ddex").Collection("users")
	_, err := users.InsertOne(bi.Ctx, bson.M{
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

	_, err = users.InsertOne(bi.Ctx, bson.M{
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

	_, err = users.InsertOne(bi.Ctx, bson.M{
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

	_, err = users.InsertOne(bi.Ctx, bson.M{
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
	bi := common.NewBaseIngester(context.Background(), "test_e2e")
	defer bi.MongoClient.Disconnect(bi.Ctx)

	err := setupEnv(bi)
	if err != nil {
		t.Fatalf("Failed to set up test environment: %v", err)
	}

	type subTest struct {
		path       string
		expectedD  common.Delivery
		expectedPR common.PendingRelease
	}

	releaseByReleaseTests := []subTest{
		{
			path: "release_by_release/ern381/sony1.zip",
			expectedD: common.Delivery{
				RemotePath:     "s3://audius-test-raw/sony1.zip",
				DeliveryStatus: constants.DeliveryStatusSuccess,
				Batches:        nil,
				Releases: []common.UnprocessedRelease{
					{
						ReleaseID:        "A10301A0005108088N",
						XmlFilePath:      "A10301A0005108088N/A10301A0005108088N.xml",
						ValidationErrors: []string{},
					},
				},
				ValidationErrors: []string(nil),
			},
			expectedPR: common.PendingRelease{
				ReleaseID:          "A10301A0005108088N",
				DeliveryRemotePath: "s3://audius-test-raw/sony1.zip",
				PublishErrors:      []string{},
				Release: common.Release{
					ReleaseProfile: common.UnspecifiedReleaseProfile,
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
						CoverArtURL:                  "s3://audius-test-crawled/A10301A0005108088N/resources/A10301A0005108088N_T-1027024165547_Image.jpg",
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
								AudioFileURL:         "s3://audius-test-crawled/A10301A0005108088N/resources/A10301A0005108088N_T-1096524256352_SoundRecording_001-001.mp3",
								AudioFileURLHash:     "8bb2ce119257314a8fcb215a49f14b33",
								AudioFileURLHashAlgo: "MD5",
								PreviewAudioFileURL:  "s3://audius-test-crawled/A10301A0005108088N/", // TODO: This doesn't seem right...
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
								AudioFileURL:         "s3://audius-test-crawled/A10301A0005108088N/resources/A10301A0005108088N_T-1096524142976_SoundRecording_001-002.mp3",
								AudioFileURLHash:     "1e9183898a4f6b45f895e45cd18ba162",
								AudioFileURLHashAlgo: "MD5",
								PreviewAudioFileURL:  "s3://audius-test-crawled/A10301A0005108088N/", // TODO: This doesn't seem right...
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
		},
	}

	batchedTests := []subTest{
		{
			path: "batch/ern382/1_CPD1.zip",
			expectedD: common.Delivery{
				RemotePath:     "s3://audius-test-raw/1_CPD1.zip",
				DeliveryStatus: constants.DeliveryStatusSuccess,
				Releases:       nil,
				Batches: []common.UnprocessedBatch{
					{
						BatchID:      "20161024145603121",
						BatchXmlPath: "20161024145603121/BatchComplete_20161024145603121.xml",
						Releases: []common.UnprocessedRelease{
							{
								ReleaseID:        "721620118165",
								XmlFilePath:      "20161024145603121/721620118165/721620118165.xml",
								ValidationErrors: []string{},
							},
						},
						ValidationErrors: []string{},
						DDEXSchema:       "382",
						NumMessages:      1,
					},
				},
				ValidationErrors: []string(nil),
			},
			expectedPR: common.PendingRelease{
				ReleaseID:          "721620118165",
				DeliveryRemotePath: "s3://audius-test-raw/1_CPD1.zip",
				PublishErrors:      []string{},
				Release: common.Release{
					ReleaseProfile: common.Common14AudioAlbumMusicOnly,
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
						CoverArtURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T7_007.jpg",
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
								AudioFileURL:    "s3://audius-test-crawled/721620118165/resources/721620118165_T1_001.wav",
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
								AudioFileURL:    "s3://audius-test-crawled/721620118165/resources/721620118165_T2_002.wav",
								IsStreamGated:   false,
								IsDownloadGated: false,
								HasDeal:         true,
							},
						},
					},
				},
			},
		},
		{
			path: "batch/fuga/20240305090206405",
			expectedD: common.Delivery{
				RemotePath:     "s3://audius-test-raw/20240305090206405",
				IsFolder:       true,
				DeliveryStatus: constants.DeliveryStatusSuccess,
				Releases:       nil,
				Batches: []common.UnprocessedBatch{
					{
						BatchID:      "20240305090206405",
						BatchXmlPath: "20240305090206405/BatchComplete_20240305090206405.xml",
						Releases: []common.UnprocessedRelease{
							{
								ReleaseID:        "8718857546047",
								XmlFilePath:      "20240305090206405/8718857546047/8718857546047.xml",
								ValidationErrors: []string{},
							},
						},
						ValidationErrors: []string{},
						DDEXSchema:       "ern/382",
						NumMessages:      1,
					},
				},
				ValidationErrors: []string(nil),
			},
			expectedPR: common.PendingRelease{
				ReleaseID:          "8718857546047",
				DeliveryRemotePath: "s3://audius-test-raw/20240305090206405",
				PublishErrors:      []string{},
				Release: common.Release{
					ReleaseProfile: common.Common13AudioSingle,
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
						CoverArtURL:         "s3://audius-test-crawled/8718857546047/resources/8718857546047_T2_Image.jpg",
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
						AudioFileURL:         stringPtr("s3://audius-test-crawled/8718857546047/resources/8718857546047_T1_0_SoundRecording_001_001.flac"),
						AudioFileURLHash:     stringPtr("5e2994cdd94f14a197283a00387ca451"),
						AudioFileURLHashAlgo: stringPtr("5e2994cdd94f14a197283a00387ca451"), // TODO: This isn't right
						Tracks:               nil,
						IsStreamGated:        false,
						IsDownloadGated:      false,
						HasDeal:              true,
					},
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
		remotePath := uploadFixture(t, bi, st.path)

		// Verify the parser (pending_releases collection)
		doc, err := wait2MinsForDoc(bi.Ctx, bi.PendingReleasesColl, bson.M{"delivery_remote_path": remotePath})
		if err != nil {
			t.Fatalf("Error finding pending release for '%s' in Mongo: %v", remotePath, err)
		}
		if doc.Err() == mongo.ErrNoDocuments {
			t.Fatalf("No pending release was found for '%s' in Mongo: %v", remotePath, doc.Err())
		}
		var pendingRelease common.PendingRelease
		if err = doc.Decode(&pendingRelease); err != nil {
			t.Fatalf("Failed to decode pending release for '%s' from Mongo: %v", remotePath, err)
		}

		assert.Equal(t, st.expectedPR.ReleaseID, pendingRelease.ReleaseID)
		assert.Equal(t, st.expectedPR.DeliveryRemotePath, pendingRelease.DeliveryRemotePath)
		assert.Equal(t, st.expectedPR.FailureCount, pendingRelease.FailureCount)
		assert.Equal(t, st.expectedPR.PublishErrors, pendingRelease.PublishErrors)
		assert.Equal(t, st.expectedPR.FailedAfterUpload, pendingRelease.FailedAfterUpload)
		assert.Equal(t, st.expectedPR.Release.ReleaseProfile, pendingRelease.Release.ReleaseProfile)

		// Compare SDKUploadMetadata without tracks (for cleaner diffing), and then compare tracks after
		expectedTracks, actualTracks := st.expectedPR.Release.SDKUploadMetadata.Tracks, pendingRelease.Release.SDKUploadMetadata.Tracks
		st.expectedPR.Release.SDKUploadMetadata.Tracks = nil
		pendingRelease.Release.SDKUploadMetadata.Tracks = nil
		assert.Equal(t, st.expectedPR.Release.SDKUploadMetadata, pendingRelease.Release.SDKUploadMetadata)
		assert.Equal(t, expectedTracks, actualTracks)

		// Verify the crawler (deliveries collection)
		doc, err = wait2MinsForDoc(bi.Ctx, bi.DeliveriesColl, bson.M{"_id": remotePath})
		if err != nil {
			t.Fatalf("Error finding delivery in Mongo: %v", err)
		}
		if doc.Err() == mongo.ErrNoDocuments {
			t.Fatalf("No delivery was found in Mongo: %v", doc.Err())
		}
		var delivery common.Delivery
		if err = doc.Decode(&delivery); err != nil {
			t.Fatalf("Failed to decode delivery from Mongo: %v", err)
		}

		// Ignore CreatedAt because we can't predict the exact time of a Mongo insert
		delivery.CreatedAt = time.Time{}

		// Similarly, ignore XMLContent because it's too much to paste
		for i := 0; i < len(delivery.Releases); i++ {
			delivery.Releases[i].XmlContent = primitive.Binary{}
			if len(st.expectedD.Releases) > i {
				st.expectedD.Releases[i].XmlContent = primitive.Binary{}
			}
		}
		for i := 0; i < len(delivery.Batches); i++ {
			delivery.Batches[i].BatchXmlContent = primitive.Binary{}
			if len(st.expectedD.Batches) > i {
				st.expectedD.Batches[i].BatchXmlContent = primitive.Binary{}
			}
			for j := 0; j < len(delivery.Batches[i].Releases); j++ {
				delivery.Batches[i].Releases[j].XmlContent = primitive.Binary{}
				if len(st.expectedD.Batches) > i && len(st.expectedD.Batches[i].Releases) > j {
					st.expectedD.Batches[i].Releases[j].XmlContent = primitive.Binary{}
				}
			}
		}
		assert.Equal(t, st.expectedD, delivery)

		// TODO: Leaving the publisher untested for now
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
func uploadFixture(t *testing.T, bi *common.BaseIngester, path string) string {
	fullPath := filepath.Join("fixtures", path)
	info, err := os.Stat(fullPath)
	if err != nil {
		t.Fatalf("Error getting file info for '%s': %v", fullPath, err)
	}

	var s3Path string
	if info.IsDir() {
		baseDir := filepath.Base(path) // Now 'baseDir' is 'someFolder' for 'fixtures/myPath/somepath/someFolder'
		s3Path, err = uploadDirectory(bi, fullPath, baseDir)
	} else {
		// If it's a ZIP file, upload directly to the root of the S3 bucket
		if strings.HasSuffix(path, ".zip") {
			_, fileName := filepath.Split(path) // Just the file name
			s3Path, err = uploadFile(bi, fullPath, "", fileName)
		}
	}
	if err != nil {
		t.Fatalf("Error uploading file or dir '%s': %v", fullPath, err)
	}

	return fmt.Sprintf("s3://%s/%s", bi.RawBucket, s3Path)
}

func uploadDirectory(bi *common.BaseIngester, dirPath, baseDir string) (string, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return "", fmt.Errorf("failed to read directory '%s': %w", dirPath, err)
	}

	for _, entry := range entries {
		if entry.Name() == ".DS_Store" {
			continue
		}

		fullPath := filepath.Join(dirPath, entry.Name())
		if entry.IsDir() {
			_, err = uploadDirectory(bi, fullPath, filepath.Join(baseDir, entry.Name()))
		} else {
			_, err = uploadFile(bi, fullPath, baseDir, entry.Name())
		}
		if err != nil {
			return "", err
		}
	}

	return baseDir, nil
}

func uploadFile(bi *common.BaseIngester, filePath, baseDir, fileName string) (string, error) {
	if fileName == ".DS_Store" {
		return "", nil
	}

	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file '%s': %w", filePath, err)
	}
	defer file.Close()

	s3Key := filepath.Join(baseDir, fileName) // Construct S3 key from baseDir and fileName

	_, err = bi.S3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(bi.RawBucket),
		Key:    aws.String(s3Key),
		Body:   file,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload '%s' to S3: %w", filePath, err)
	}

	return s3Key, nil
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
