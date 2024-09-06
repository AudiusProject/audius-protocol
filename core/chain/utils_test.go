package chain

import (
	"testing"
	"time"

	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestDedupeTx(t *testing.T) {
	listensOne := []*gen_proto.Listen{
		{
			UserId:    uuid.NewString(),
			TrackId:   uuid.NewString(),
			Timestamp: timestamppb.New(time.Now()),
			Signature: "todo: impl",
		},
		{
			UserId:    uuid.NewString(),
			TrackId:   uuid.NewString(),
			Timestamp: timestamppb.New(time.Now()),
			Signature: "todo: impl",
		},
		{
			UserId:    uuid.NewString(),
			TrackId:   uuid.NewString(),
			Timestamp: timestamppb.New(time.Now()),
			Signature: "todo: impl",
		},
	}

	playEventOne := &gen_proto.Event{
		Body: &gen_proto.Event_Plays{
			Plays: &gen_proto.PlaysEvent{
				Listens: listensOne,
			},
		},
	}

	listensTwo := []*gen_proto.Listen{
		{
			UserId:    uuid.NewString(),
			TrackId:   uuid.NewString(),
			Timestamp: timestamppb.New(time.Now()),
			Signature: "todo: impl",
		},
	}

	playEventTwo := &gen_proto.Event{
		Body: &gen_proto.Event_Plays{
			Plays: &gen_proto.PlaysEvent{
				Listens: listensTwo,
			},
		},
	}

	txOneBytes, err := proto.Marshal(playEventOne)
	require.Nil(t, err)

	txTwoBytes, err := proto.Marshal(playEventTwo)
	require.Nil(t, err)

	txs := [][]byte{txOneBytes, txOneBytes, txOneBytes, txTwoBytes, txTwoBytes}
	dedupedTxs := removeDuplicateTxs(txs)

	require.EqualValues(t, len(dedupedTxs), 2)
	require.EqualValues(t, dedupedTxs[0], txOneBytes)
	require.EqualValues(t, dedupedTxs[1], txTwoBytes)
}
