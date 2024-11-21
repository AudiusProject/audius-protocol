package common

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/models"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/go-openapi/strfmt"
)

// converts a proto signed tx into an oapi one, mainly used for tx broadcasting
// only covers entitymanager and plays
func SignedTxProtoIntoSignedTxOapi(tx *proto.SignedTransaction) *models.ProtocolSignedTransaction {
	oapiTx := &models.ProtocolSignedTransaction{
		RequestID: tx.RequestId,
		Signature: tx.Signature,
	}

	switch innerTx := tx.Transaction.(type) {
	case *proto.SignedTransaction_Plays:
		plays := []*models.ProtocolTrackPlay{}

		for _, play := range innerTx.Plays.GetPlays() {
			plays = append(plays, &models.ProtocolTrackPlay{
				UserID:    play.UserId,
				TrackID:   play.TrackId,
				Signature: play.Signature,
				Timestamp: strfmt.DateTime(play.Timestamp.AsTime()),
				City:      play.City,
				Country:   play.Country,
				Region:    play.Region,
			})
		}

		oapiTx.Plays = &models.ProtocolTrackPlays{
			Plays: plays,
		}
	case *proto.SignedTransaction_ManageEntity:
		oapiTx.ManageEntity = &models.ProtocolManageEntityLegacy{
			Action:     innerTx.ManageEntity.Action,
			EntityID:   fmt.Sprint(innerTx.ManageEntity.EntityId),
			EntityType: innerTx.ManageEntity.EntityType,
			Metadata:   innerTx.ManageEntity.Metadata,
			UserID:     fmt.Sprint(innerTx.ManageEntity.UserId),
			Signature:  innerTx.ManageEntity.Signature,
		}
	case *proto.SignedTransaction_ValidatorRegistration:
		oapiTx.ValidatorRegistration = &models.ProtocolValidatorRegistration{
			CometAddress: innerTx.ValidatorRegistration.CometAddress,
			Endpoint:     innerTx.ValidatorRegistration.Endpoint,
			EthBlock:     innerTx.ValidatorRegistration.EthBlock,
			NodeType:     innerTx.ValidatorRegistration.NodeType,
			SpID:         innerTx.ValidatorRegistration.SpId,
		}
	}

	return oapiTx
}
