package integration

import (
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_openapi/protocol"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/models"
	"github.com/AudiusProject/audius-protocol/pkg/core/test/integration/utils"
	"github.com/go-openapi/strfmt"
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("OpenAPI", func() {
	It("can get node info", func() {
		sdk := utils.ContentTwo

		params := protocol.NewProtocolGetNodeInfoParams()
		res, err := sdk.ProtocolGetNodeInfo(params)
		Expect(err).To(BeNil())

		payload := res.Payload
		Expect(payload.Chainid).To(BeEquivalentTo("audius-devnet"))
	})

	It("can get blocks", func() {
		sdk := utils.ContentOne

		params := protocol.NewProtocolGetBlockParams()
		params.Height = "1"
		res, err := sdk.ProtocolGetBlock(params)
		Expect(err).To(BeNil())

		payload := res.Payload
		Expect(payload.Height).To(BeEquivalentTo("1"))
	})

	It("can send some plays", func() {
		sdk := utils.ContentTwo

		playOne := &models.ProtocolTrackPlay{
			UserID:    uuid.NewString(),
			TrackID:   "track1",
			Timestamp: strfmt.DateTime(time.Now()),
			Signature: "signature1",
		}

		playTwo := &models.ProtocolTrackPlay{
			UserID:    uuid.NewString(),
			TrackID:   "track1",
			Timestamp: strfmt.DateTime(time.Now()),
			Signature: "signature2",
		}

		trackPlays := &models.ProtocolTrackPlays{
			Plays: []*models.ProtocolTrackPlay{playOne, playTwo},
		}

		requestId := uuid.NewString()
		signature := uuid.NewString()
		signedTransaction := &models.ProtocolSignedTransaction{
			Signature: signature,
			RequestID: requestId,
			Plays:     trackPlays,
		}

		sendParams := protocol.NewProtocolSendTransactionParams()
		sendParams.SetTransaction(signedTransaction)

		res, err := sdk.ProtocolSendTransaction(sendParams)
		Expect(err).To(BeNil())

		payload := res.Payload
		Expect(payload.Txhash).To(Not(BeEmpty()))

		// let indexer pick up tx
		time.Sleep(2 * time.Second)

		getParams := protocol.NewProtocolGetTransactionParams()
		getParams.SetTxhash(payload.Txhash)

		getRes, err := sdk.ProtocolGetTransaction(getParams)
		Expect(err).To(BeNil())

		Expect(getRes.Payload.Txhash).To(Equal(payload.Txhash))

		transaction := getRes.Payload.Transaction
		Expect(transaction.Plays).To(Not(BeNil()))

		plays := transaction.Plays
		getPlayOne := plays.Plays[0]
		getPlayTwo := plays.Plays[1]

		Expect(getPlayOne.Signature).To(Equal(playOne.Signature))
		Expect(getPlayOne.UserID).To(Equal(playOne.UserID))
		Expect(getPlayOne.TrackID).To(Equal(playOne.TrackID))
		Expect(getPlayTwo.Signature).To(Equal(playTwo.Signature))
		Expect(getPlayTwo.UserID).To(Equal(playTwo.UserID))
		Expect(getPlayTwo.TrackID).To(Equal(playTwo.TrackID))
	})
})
