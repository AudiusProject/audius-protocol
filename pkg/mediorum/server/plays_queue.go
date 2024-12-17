package server

import (
	"context"
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server/signature"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const playBatch = 500

type PlayRecord struct {
	RowID     int
	UserID    string
	TrackID   string
	PlayTime  time.Time
	Signature string
	City      string
	Region    string
	Country   string
}

func (ss *MediorumServer) insertPlayRecord(record *PlayRecord) error {
	query := `
	INSERT INTO plays_queue (
		user_id, track_id, play_time, signature, city, region, country
	) 
	VALUES ($1, $2, $3, $4, $5, $6, $7);
`

	_, err := ss.pgPool.Exec(
		context.Background(),
		query,
		record.UserID, record.TrackID, record.PlayTime, record.Signature, record.City, record.Region, record.Country,
	)
	return err
}

func (ss *MediorumServer) startPlayQueue() {
	<-ss.coreSdkReady

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := ss.processPlayRecordBatch(); err != nil {
			ss.logger.Error("error recording play batch", "error", err)
		}
	}
}

func (ss *MediorumServer) processPlayRecordBatch() error {
	ctx := context.Background()

	tx, err := ss.pgPool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("couldn't begin pgpool tx: %v", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	// get batch of plays from db
	query := `
	WITH batch AS (
		SELECT rowid, user_id, track_id, play_time, signature, city, region, country
		FROM plays_queue
		ORDER BY rowid
		LIMIT $1
	)
	SELECT * FROM batch;
`
	rows, err := tx.Query(ctx, query, playBatch)
	if err != nil {
		return fmt.Errorf("failed to fetch batch: %v", err)
	}
	defer rows.Close()

	plays := []PlayRecord{}
	for rows.Next() {
		var play PlayRecord
		if err := rows.Scan(&play.RowID, &play.UserID, &play.TrackID, &play.PlayTime, &play.Signature, &play.City, &play.Region, &play.Country); err != nil {
			return fmt.Errorf("failed to scan row: %v", err)
		}
		plays = append(plays, play)
	}

	if len(plays) == 0 {
		return nil
	}

	// assemble batch of plays into core tx
	sdk := ss.coreSdk

	corePlays := []*core_proto.TrackPlay{}
	for _, play := range plays {
		corePlays = append(corePlays, &core_proto.TrackPlay{
			UserId:    play.UserID,
			TrackId:   play.TrackID,
			Timestamp: timestamppb.New(play.PlayTime),
			Signature: play.Signature,
			City:      play.City,
			Country:   play.Country,
			Region:    play.Region,
		})
	}

	playsTx := &core_proto.TrackPlays{
		Plays: corePlays,
	}

	// sign plays event payload with mediorum priv key
	signedPlaysEvent, err := signature.SignCoreBytes(playsTx, ss.Config.privateKey)
	if err != nil {
		ss.logger.Error("core error signing listen proto event", "err", err)
		return err
	}

	// construct proto listen signedTx alongside signature of plays signedTx
	signedTx := &core_proto.SignedTransaction{
		Signature: signedPlaysEvent,
		Transaction: &core_proto.SignedTransaction_Plays{
			Plays: playsTx,
		},
	}

	ss.logger.Info("sending", "tx", signedTx)

	// submit to configured core node
	res, err := sdk.SendTransaction(ctx, &core_proto.SendTransactionRequest{
		Transaction: signedTx,
	})

	if err != nil {
		ss.logger.Error("core error submitting listen event", "err", err)
		return err
	}

	ss.logger.Info("core %d listens recorded", "tx", len(corePlays), res.Txhash)

	// delete play records once persisted in core tx
	deleteQuery := `
	DELETE FROM plays_queue
	WHERE rowid IN (
		SELECT rowid FROM (
			SELECT rowid FROM plays_queue
			ORDER BY rowid
			LIMIT $1
		) AS subquery
	);
`
	_, err = tx.Exec(ctx, deleteQuery, playBatch)
	if err != nil {
		return fmt.Errorf("failed to delete batch: %v", err)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}
