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
		eTag       string
		expectedD  common.Delivery
		expectedPR common.PendingRelease
	}

	releaseByReleaseTests := []subTest{
		{
			path: "release_by_release/ern381/sony1.zip",
			eTag: "bed7beaa33eed67bb1ba73353dd51e1d",
			expectedD: common.Delivery{
				ZIPFilePath:    "s3://audius-test-raw/sony1.zip",
				ZIPFileETag:    "bed7beaa33eed67bb1ba73353dd51e1d",
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
				DeliveryETag:       "bed7beaa33eed67bb1ba73353dd51e1d",
				PublishDate:        time.Date(2023, time.September, 1, 0, 0, 0, 0, time.UTC),
				PublishErrors:      []string{},
				CreateTrackRelease: common.CreateTrackRelease{},
				CreateAlbumRelease: common.CreateAlbumRelease{
					DDEXReleaseRef: "R0",
					Metadata: common.CollectionMetadata{
						PlaylistName:      "Present.",
						PlaylistOwnerID:   "Bmv3bJ",
						PlaylistOwnerName: "Theo Random",
						ReleaseDate:       time.Date(2023, time.September, 1, 0, 0, 0, 0, time.UTC),
						DDEXReleaseIDs: common.ReleaseIDs{
							CatalogNumber: "G010005108088N",
							GRid:          "A10301A0005108088N",
							ICPN:          "196871335584",
						},
						IsAlbum:             true,
						IsPrivate:           false,
						Genre:               common.HipHopRap,
						CoverArtURL:         "s3://audius-test-crawled/A10301A0005108088N/resources/A10301A0005108088N_T-1027024165547_Image.jpg",
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
							PreviewAudioFileURL:  "s3://audius-test-crawled/A10301A0005108088N/",
							AudioFileURL:         "s3://audius-test-crawled/A10301A0005108088N/resources/A10301A0005108088N_T-1096524256352_SoundRecording_001-001.mp3",
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
							PreviewAudioFileURL:  "s3://audius-test-crawled/A10301A0005108088N/",
							AudioFileURL:         "s3://audius-test-crawled/A10301A0005108088N/resources/A10301A0005108088N_T-1096524142976_SoundRecording_001-002.mp3",
							AudioFileURLHash:     "1e9183898a4f6b45f895e45cd18ba162",
							AudioFileURLHashAlgo: "MD5",
							ProducerCopyrightLine: &common.Copyright{
								Year: "2023",
								Text: "(P) 2023 South Africa - Sony Music Entertainment Africa (Pty) Ltd, under Sound African Recordings a division of Sony Music Entertainment Africa (Pty) Ltd",
							},
							ParentalWarningType: stringPtr("Explicit"),
						},
					},
				},
			},
		},
	}

	batchedTests := []subTest{
		{
			path: "batch/ern382/CPD1.zip",
			eTag: "5e425b53234b868374c0b02e0b58b1cc",
			expectedD: common.Delivery{
				ZIPFilePath:    "s3://audius-test-raw/CPD1.zip",
				ZIPFileETag:    "5e425b53234b868374c0b02e0b58b1cc",
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
					},
				},
				ValidationErrors: []string(nil),
			},
			expectedPR: common.PendingRelease{
				ReleaseID:          "721620118165",
				DeliveryETag:       "5e425b53234b868374c0b02e0b58b1cc",
				PublishDate:        time.Date(2010, time.October, 1, 0, 0, 0, 0, time.UTC),
				PublishErrors:      []string{},
				CreateTrackRelease: common.CreateTrackRelease{},
				CreateAlbumRelease: common.CreateAlbumRelease{
					Metadata: common.CollectionMetadata{
						PlaylistName:      "A Monkey Claw in a Velvet Glove",
						PlaylistOwnerID:   "abcdef",
						PlaylistOwnerName: "Monkey Claw",
						IsAlbum:           true,
						IsPrivate:         false,
						Genre:             "Metal",
						ReleaseDate:       time.Date(2010, time.October, 1, 0, 0, 0, 0, time.UTC),
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
		uploadFixture(t, bi, st.path)

		// Verify the parser (pending_releases collection)
		doc, err := waitForDocument(bi.Ctx, bi.PendingReleasesColl, bson.M{"delivery_etag": st.eTag})
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

		// Ignore CreatedAt because we can't predict the exact time of a Mongo insert
		pendingRelease.CreatedAt = time.Time{}

		assert.Equal(t, st.expectedPR, pendingRelease)

		// Verify the crawler (deliveries collection)
		doc, err = waitForDocument(bi.Ctx, bi.DeliveriesColl, bson.M{"_id": st.eTag})
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

		// Similarly, gnore XMLContent because it's too much to paste
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

// uploadFixture uploads a test fixture to the S3 "raw" bucket
func uploadFixture(t *testing.T, bi *common.BaseIngester, filepath string) {
	filepath = fmt.Sprintf("./fixtures/%s", filepath)
	file, err := os.Open(filepath)
	if err != nil {
		bi.Logger.Error("Failed to open test file", "error", err)
	}
	defer file.Close()

	_, err = bi.S3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(bi.RawBucket),
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
