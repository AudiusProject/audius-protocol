package main

import (
	"context"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestRunE2E(t *testing.T) {
	e := &e2eTest{
		BaseIngester: common.NewBaseIngester(context.Background(), "test_e2e"),
	}
	defer e.MongoClient.Disconnect(e.Ctx)

	err := e.setupEnv()
	if err != nil {
		t.Fatalf("Failed to set up test environment: %v", err)
	}

	choreography := common.MustGetChoreography()
	if choreography == constants.ERNReleaseByRelease {
		e.runERN381ReleaseByRelease(t)
	} else if choreography == constants.ERNBatched {
		e.runERN382Batched(t)
	} else {
		t.Fatalf("Unexpected choreography: %s", choreography)
	}
}

type e2eTest struct {
	*common.BaseIngester
}

func (e *e2eTest) setupEnv() error {
	if err := createBucket(e.S3Client, e.RawBucket); err != nil {
		return err
	}
	if err := createBucket(e.S3Client, e.CrawledBucket); err != nil {
		return err
	}
	fmt.Printf("Created buckets: %s, %s\n", e.RawBucket, e.CrawledBucket)

	users := e.MongoClient.Database("ddex").Collection("users")
	_, err := users.InsertOne(e.Ctx, bson.M{
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

	_, err = users.InsertOne(e.Ctx, bson.M{
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

	return nil
}

// TODO: Turn this into a table test
func (e *e2eTest) runERN382Batched(t *testing.T) {
	e.Logger.Info("Starting E2E test for ERN 382 Batched choreography")

	e.uploadFixture(t, "batch/ern382/CPD1.zip")
	eTag := "5e425b53234b868374c0b02e0b58b1cc"

	// Verify the crawler (deliveries collection)
	doc, err := waitForDocument(e.Ctx, e.DeliveriesColl, bson.M{"_id": eTag})
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
	assert.Equal(t, "s3://audius-test-raw/CPD1.zip", delivery.ZIPFilePath, "Path doesn't match expected")
	assert.Equal(t, delivery.ZIPFileETag, eTag, "ETag (delivery ID) doesn't match expected")
	assert.Equal(t, constants.DeliveryStatusParsing, delivery.DeliveryStatus, "delivery_status doesn't match expected")
	assert.Equal(t, 0, len(delivery.Releases), "Expected 0 root releases in delivery")
	assert.Equal(t, 1, len(delivery.Batches), "Expected 1 batch in delivery")
	assert.Equal(t, "20161024145603121/BatchComplete_20161024145603121.xml", delivery.Batches[0].BatchXmlPath, "Batch XML path doesn't match expected")
	assert.Equal(t, 1, len(delivery.Batches[0].Releases), "Expected 1 release in first batch")
	assert.Equal(t, "721620118165", delivery.Batches[0].Releases[0].ReleaseID, "Release ID doesn't match expected")
	assert.Equal(t, "20161024145603121/721620118165/721620118165.xml", delivery.Batches[0].Releases[0].XmlFilePath, "Release XML path doesn't match expected")

	// Verify the parser (pending_deliveries collection)
	doc, err = waitForDocument(e.Ctx, e.PendingReleasesColl, bson.M{"delivery_etag": eTag})
	if err != nil {
		t.Fatalf("Error finding pending release in Mongo: %v", err)
	}
	if doc.Err() == mongo.ErrNoDocuments {
		t.Fatalf("No pending release was found in Mongo: %v", doc.Err())
	}
	var pendingRelease common.PendingRelease
	if err = doc.Decode(&pendingRelease); err != nil {
		t.Fatalf("Failed to decode pending release from Mongo: %v", err)
	}
	publishDate := time.Date(2010, time.October, 1, 0, 0, 0, 0, time.UTC)
	assert.Equal(t, publishDate, pendingRelease.PublishDate, "publish_date doesn't match expected")
	assert.Equal(t, common.CreateTrackRelease{}, pendingRelease.CreateTrackRelease, "Unexpected non-empty track release")
	assert.Equal(t, []string(nil), delivery.ValidationErrors, "Expected there to be no validation errors")
	assert.Equal(t, []string{}, delivery.Batches[0].ValidationErrors, "Expected there to be no validation errors")
	assert.Equal(t, []string{}, pendingRelease.PublishErrors, "Expected there to be no publish errors")
	assert.Equal(t, common.CreateAlbumRelease{
		Metadata: common.CollectionMetadata{
			PlaylistName:      "A Monkey Claw in a Velvet Glove",
			PlaylistOwnerID:   "abcdef",
			PlaylistOwnerName: "Monkey Claw",
			IsAlbum:           true,
			IsPrivate:         false,
			Genre:             "Metal",
			ReleaseDate:       publishDate,
			DDEXReleaseIDs: common.ReleaseIDs{
				ICPN: "721620118165",
			},
			CoverArtURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T7_007.jpg",
			Artists: []common.ResourceContributor{{
				Name:           "Monkey Claw",
				Roles:          []string{"MainArtist"},
				SequenceNumber: 1,
			}},
			CopyrightLine: &common.Copyright{
				Year: "2010",
				Text: "(C) 2010 Iron Crown Music",
			},
			ProducerCopyrightLine: &common.Copyright{
				Year: "2010",
				Text: "(P) 2010 Iron Crown Music",
			},
			ParentalWarningType: stringPtr("NotExplicit"),
		},
		DDEXReleaseRef: "R0",
		Tracks: []common.TrackMetadata{
			{
				Title:       "Can you feel ...the Monkey Claw!",
				ReleaseDate: time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC),
				DDEXReleaseIDs: common.ReleaseIDs{
					ISRC: "CASE00000001",
				},
				Genre:    "Metal",
				Duration: 811,
				ISRC:     stringPtr("CASE00000001"),
				Artists: []common.ResourceContributor{
					{
						Name:           "Monkey Claw",
						Roles:          []string{"MainArtist"},
						SequenceNumber: 1,
					},
				},
				ResourceContributors: []common.ResourceContributor{{
					Name:           "Steve Albino",
					Roles:          []string{"Producer"},
					SequenceNumber: 1,
				}},
				IndirectResourceContributors: []common.ResourceContributor{{
					Name:           "Bob Black",
					Roles:          []string{"Composer"},
					SequenceNumber: 1,
				}},
				AudioFileURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T1_001.wav",
				CopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(C) 2010 Iron Crown Music",
				},
				ProducerCopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(P) 2010 Iron Crown Music",
				},
				ParentalWarningType: stringPtr("NotExplicit"),
			},
			{
				Title:       "Red top mountain, blown sky high",
				ReleaseDate: time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC),
				DDEXReleaseIDs: common.ReleaseIDs{
					ISRC: "CASE00000002",
				},
				Genre:    "Metal",
				Duration: 366,
				ISRC:     stringPtr("CASE00000002"),
				Artists: []common.ResourceContributor{
					{
						Name:           "Monkey Claw",
						Roles:          []string{"MainArtist"},
						SequenceNumber: 1,
					},
				},
				ResourceContributors: []common.ResourceContributor{{
					Name:           "Steve Albino",
					Roles:          []string{"Producer"},
					SequenceNumber: 1,
				}},
				IndirectResourceContributors: []common.ResourceContributor{{
					Name:           "Bob Black",
					Roles:          []string{"Composer"},
					SequenceNumber: 1,
				}},
				AudioFileURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T2_002.wav",
				CopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(C) 2010 Iron Crown Music",
				},
				ProducerCopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(P) 2010 Iron Crown Music",
				},
				ParentalWarningType: stringPtr("NotExplicit"),
			},
			{
				Title:       "Seige of Antioch",
				ReleaseDate: time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC),
				DDEXReleaseIDs: common.ReleaseIDs{
					ISRC: "CASE00000003",
				},
				Genre:    "Metal",
				Duration: 1269,
				ISRC:     stringPtr("CASE00000003"),
				Artists: []common.ResourceContributor{
					{
						Name:           "Monkey Claw",
						Roles:          []string{"MainArtist"},
						SequenceNumber: 1,
					},
				},
				ResourceContributors: []common.ResourceContributor{{
					Name:           "Steve Albino",
					Roles:          []string{"Producer"},
					SequenceNumber: 1,
				}},
				IndirectResourceContributors: []common.ResourceContributor{{
					Name:           "Bob Black",
					Roles:          []string{"Composer"},
					SequenceNumber: 1,
				}},
				AudioFileURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T3_003.wav",
				CopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(C) 2010 Iron Crown Music",
				},
				ProducerCopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(P) 2010 Iron Crown Music",
				},
				ParentalWarningType: stringPtr("NotExplicit"),
			},
			{
				Title:       "Warhammer",
				ReleaseDate: time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC),
				DDEXReleaseIDs: common.ReleaseIDs{
					ISRC: "CASE00000004",
				},
				Genre:    "Metal",
				Duration: 165,
				ISRC:     stringPtr("CASE00000004"),
				Artists: []common.ResourceContributor{
					{
						Name:           "Monkey Claw",
						Roles:          []string{"MainArtist"},
						SequenceNumber: 1,
					},
				},
				ResourceContributors: []common.ResourceContributor{{
					Name:           "Steve Albino",
					Roles:          []string{"Producer"},
					SequenceNumber: 1,
				}},
				IndirectResourceContributors: []common.ResourceContributor{{
					Name:           "Bob Black",
					Roles:          []string{"Composer"},
					SequenceNumber: 1,
				}},
				AudioFileURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T4_004.wav",
				CopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(C) 2010 Iron Crown Music",
				},
				ProducerCopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(P) 2010 Iron Crown Music",
				},
				ParentalWarningType: stringPtr("NotExplicit"),
			},
			{
				Title:       "Iron Horse",
				ReleaseDate: time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC),
				DDEXReleaseIDs: common.ReleaseIDs{
					ISRC: "CASE00000005",
				},
				Genre:    "Metal",
				Duration: 294,
				ISRC:     stringPtr("CASE00000005"),
				Artists: []common.ResourceContributor{
					{
						Name:           "Monkey Claw",
						Roles:          []string{"MainArtist"},
						SequenceNumber: 1,
					},
				},
				ResourceContributors: []common.ResourceContributor{{
					Name:           "Steve Albino",
					Roles:          []string{"Producer"},
					SequenceNumber: 1,
				}},
				IndirectResourceContributors: []common.ResourceContributor{{
					Name:           "Bob Black",
					Roles:          []string{"Composer"},
					SequenceNumber: 1,
				}},
				AudioFileURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T5_005.wav",
				CopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(C) 2010 Iron Crown Music",
				},
				ProducerCopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(P) 2010 Iron Crown Music",
				},
				ParentalWarningType: stringPtr("NotExplicit"),
			},
			{
				Title:       "Yes... I can feel the Monkey Claw!",
				ReleaseDate: time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC),
				DDEXReleaseIDs: common.ReleaseIDs{
					ISRC: "CASE00000006",
				},
				Genre:    "Metal",
				Duration: 741,
				ISRC:     stringPtr("CASE00000006"),
				Artists: []common.ResourceContributor{
					{
						Name:           "Monkey Claw",
						Roles:          []string{"MainArtist"},
						SequenceNumber: 1,
					},
				},
				ResourceContributors: []common.ResourceContributor{{
					Name:           "Steve Albino",
					Roles:          []string{"Producer"},
					SequenceNumber: 1,
				}},
				IndirectResourceContributors: []common.ResourceContributor{{
					Name:           "Bob Black",
					Roles:          []string{"Composer"},
					SequenceNumber: 1,
				}},
				AudioFileURL: "s3://audius-test-crawled/721620118165/resources/721620118165_T6_006.wav",
				CopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(C) 2010 Iron Crown Music",
				},
				ProducerCopyrightLine: &common.Copyright{
					Year: "2010",
					Text: "(P) 2010 Iron Crown Music",
				},
				ParentalWarningType: stringPtr("NotExplicit"),
			},
		},
	}, pendingRelease.CreateAlbumRelease, "Album release doesn't match expected")
}

func (e *e2eTest) runERN381ReleaseByRelease(t *testing.T) {
	e.Logger.Info("Starting E2E test for ERN 381 Release-By-Release choreography")

	e.uploadFixture(t, "release_by_release/ern381/sony1.zip")
	eTag := "b0271b98d23e02947e86b5857e25e4c0"

	// Verify the crawler (deliveries collection)
	doc, err := waitForDocument(e.Ctx, e.DeliveriesColl, bson.M{"_id": eTag})
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
	assert.Equal(t, "s3://audius-test-raw/sony1.zip", delivery.ZIPFilePath, "Path doesn't match expected")
	assert.Equal(t, delivery.ZIPFileETag, eTag, "ETag (delivery ID) doesn't match expected")
	assert.Equal(t, constants.DeliveryStatusParsing, delivery.DeliveryStatus, "delivery_status doesn't match expected")
	assert.Equal(t, 1, len(delivery.Releases), "Expected 1 release in delivery")
	assert.Equal(t, 0, len(delivery.Batches), "Expected 0 batches in delivery")
	assert.Equal(t, "A10301A0005108088N", delivery.Releases[0].ReleaseID, "Release ID doesn't match expected")
	assert.Equal(t, "A10301A0005108088N/A10301A0005108088N.xml", delivery.Releases[0].XmlFilePath, "XML path doesn't match expected")

	// Verify the parser (pending_deliveries collection)
	doc, err = waitForDocument(e.Ctx, e.PendingReleasesColl, bson.M{"delivery_etag": eTag})
	if err != nil {
		t.Fatalf("Error finding pending release in Mongo: %v", err)
	}
	if doc.Err() == mongo.ErrNoDocuments {
		t.Fatalf("No pending release was found in Mongo: %v", doc.Err())
	}
	var pendingRelease common.PendingRelease
	if err = doc.Decode(&pendingRelease); err != nil {
		t.Fatalf("Failed to decode pending release from Mongo: %v", err)
	}
	publishDate := time.Date(2023, time.September, 1, 0, 0, 0, 0, time.UTC)
	assert.Equal(t, publishDate, pendingRelease.PublishDate, "publish_date doesn't match expected")
	assert.Equal(t, common.CreateTrackRelease{}, pendingRelease.CreateTrackRelease, "Unexpected non-empty track release")
	assert.Equal(t, []string(nil), delivery.ValidationErrors, "Expected there to be no validation errors")
	assert.Equal(t, []string{}, delivery.Releases[0].ValidationErrors, "Expected there to be no validation errors")
	assert.Equal(t, []string{}, pendingRelease.PublishErrors, "Expected there to be no publish errors")
	assert.Equal(t, common.CreateAlbumRelease{
		DDEXReleaseRef: "R0",
		Metadata: common.CollectionMetadata{
			PlaylistName:      "Present.",
			PlaylistOwnerID:   "Bmv3bJ",
			PlaylistOwnerName: "Theo Random",
			ReleaseDate:       publishDate,
			DDEXReleaseIDs: common.ReleaseIDs{
				CatalogNumber: "G010005108088N",
				GRid:          "A10301A0005108088N",
				ICPN:          "196871335584",
			},
			IsAlbum:             true,
			IsPrivate:           false,
			Genre:               common.HipHopRap,
			CoverArtURL:         fmt.Sprintf("s3://audius-test-crawled/%s/resources/A10301A0005108088N_T-1027024165547_Image.jpg", pendingRelease.ReleaseID),
			CoverArtURLHash:     "582fb410615167205e8741580cf77e71",
			CoverArtURLHashAlgo: "MD5",
			Artists: []common.ResourceContributor{{
				Name:           "Theo Random",
				Roles:          []string{"MainArtist"},
				SequenceNumber: 1,
			}},
			ProducerCopyrightLine: &common.Copyright{
				Year: "2023",
				Text: "(P) 2023 South Africa - Sony Music Entertainment Africa (Pty) Ltd, under Sound African Recordings a division of Sony Music Entertainment Africa (Pty) Ltd",
			},
			ParentalWarningType: stringPtr("Explicit"),
		},
		Tracks: []common.TrackMetadata{
			{
				Title:       "Playing With Fire.",
				ReleaseDate: time.Time{},
				Genre:       common.HipHopRap,
				Duration:    279,
				Artists: []common.ResourceContributor{{
					Name:           "Theo Random",
					Roles:          []string{"AssociatedPerformer", "MainArtist"},
					SequenceNumber: 1,
				}},
				ResourceContributors: []common.ResourceContributor{
					{
						Name:           "Thabiso Moya",
						Roles:          []string{"Composer", "Lyricist"},
						SequenceNumber: 1,
					},
					{
						Name:           "Melange",
						Roles:          []string{"Producer"},
						SequenceNumber: 2,
					},
					{
						Name:           "Neo Ndungane",
						Roles:          []string{"Composer", "Lyricist"},
						SequenceNumber: 3,
					},
					{
						Name:           "Feziekk",
						Roles:          []string{"Producer"},
						SequenceNumber: 4,
					},
					{
						Name:           "Regaugetsue Refenyeditswe Leshabane",
						Roles:          []string{"Composer", "Lyricist"},
						SequenceNumber: 5,
					},
					{
						Name:           "Gabe Archibald Horowitz",
						Roles:          []string{"Composer", "Lyricist"},
						SequenceNumber: 6,
					},
				},
				ArtistID:   "",
				ArtistName: "",
				ISRC:       stringPtr("ZAA012300131"),
				DDEXReleaseIDs: common.ReleaseIDs{
					GRid: "A10328E0010879163O",
					ISRC: "ZAA012300131",
				},
				PreviewStartSeconds:  intPtr(48),
				PreviewAudioFileURL:  fmt.Sprintf("s3://audius-test-crawled/%s/", pendingRelease.ReleaseID),
				AudioFileURL:         fmt.Sprintf("s3://audius-test-crawled/%s/resources/A10301A0005108088N_T-1096524256352_SoundRecording_001-001.m4a", pendingRelease.ReleaseID),
				AudioFileURLHash:     "8bb2ce119257314a8fcb215a49f14b33",
				AudioFileURLHashAlgo: "MD5",
				ProducerCopyrightLine: &common.Copyright{
					Year: "2023",
					Text: "(P) 2023 South Africa - Sony Music Entertainment Africa (Pty) Ltd, under Sound African Recordings a division of Sony Music Entertainment Africa (Pty) Ltd",
				},
				ParentalWarningType: stringPtr("Explicit"),
			},
			{
				Title:       "No Comment.",
				ReleaseDate: time.Time{},
				Genre:       common.HipHopRap,
				Duration:    142,
				ArtistID:    "",
				ArtistName:  "",
				Artists: []common.ResourceContributor{
					{
						Name:           "Theo Random",
						Roles:          []string{"AssociatedPerformer", "MainArtist"},
						SequenceNumber: 1,
					},
					{
						Name:           "Thato Saul",
						Roles:          []string{"AssociatedPerformer", "MainArtist"},
						SequenceNumber: 2,
					},
				},
				ResourceContributors: []common.ResourceContributor{
					{
						Name:           "Theo Random & Thato Saul",
						Roles:          []string{"AssociatedPerformer"},
						SequenceNumber: 1,
					},
					{
						Name:           "Thabiso Moya",
						Roles:          []string{"Composer", "Lyricist"},
						SequenceNumber: 2,
					},
					{
						Name:           "Melange",
						Roles:          []string{"Producer"},
						SequenceNumber: 3,
					},
					{
						Name:           "Thato Matlebyane",
						Roles:          []string{"Composer", "Lyricist"},
						SequenceNumber: 4,
					},
					{
						Name:           "Neo Ndungane",
						Roles:          []string{"Composer", "Lyricist"},
						SequenceNumber: 5,
					},
				},
				ISRC: stringPtr("ZAA012300128"),
				DDEXReleaseIDs: common.ReleaseIDs{
					GRid: "A10328E0010879164M",
					ISRC: "ZAA012300128",
				},
				PreviewStartSeconds:  intPtr(48),
				PreviewAudioFileURL:  fmt.Sprintf("s3://audius-test-crawled/%s/", pendingRelease.ReleaseID),
				AudioFileURL:         fmt.Sprintf("s3://audius-test-crawled/%s/resources/A10301A0005108088N_T-1096524142976_SoundRecording_001-002.m4a", pendingRelease.ReleaseID),
				AudioFileURLHash:     "1e9183898a4f6b45f895e45cd18ba162",
				AudioFileURLHashAlgo: "MD5",
				ProducerCopyrightLine: &common.Copyright{
					Year: "2023",
					Text: "(P) 2023 South Africa - Sony Music Entertainment Africa (Pty) Ltd, under Sound African Recordings a division of Sony Music Entertainment Africa (Pty) Ltd",
				},
				ParentalWarningType: stringPtr("Explicit"),
			},
		},
	}, pendingRelease.CreateAlbumRelease, "Album release doesn't match expected")

	// TODO: Leaving the publisher untested for now
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

// uploadFixture uploads a test fixture to the S3 "raw" bucket
func (e *e2eTest) uploadFixture(t *testing.T, filepath string) {
	filepath = fmt.Sprintf("./fixtures/%s", filepath)
	file, err := os.Open(filepath)
	if err != nil {
		e.Logger.Error("Failed to open test file", "error", err)
	}
	defer file.Close()

	_, err = e.S3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(e.RawBucket),
		Key:    aws.String(strings.Split(filepath, "/")[len(strings.Split(filepath, "/"))-1]),
		Body:   file,
	})
	if err != nil {
		t.Fatalf("Failed to upload '%s' to S3: %v", filepath, err)
	}
}

func waitForDocument(ctx context.Context, collection *mongo.Collection, filter bson.M) (*mongo.SingleResult, error) {
	var doc *mongo.SingleResult
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err() // Context was canceled or timed out
		case <-ticker.C:
			doc = collection.FindOne(ctx, filter)
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
