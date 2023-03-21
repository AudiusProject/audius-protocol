package em

import (
	"os"

	"comms.audius.co/discovery/db"
	"github.com/inconshreveable/log15"
)

func processEntityManagerAction(action *EntityManagerAction) {
	logger := log15.New("user_id", action.UserID, "action", action.Action+action.EntityType, "entity_id", action.EntityID)
	logger.SetHandler(log15.StreamHandler(os.Stdout, log15.TerminalFormat()))

	tx, err := db.Conn.Begin()
	if err != nil {
		panic(err)
	}
	defer tx.Rollback()

	fqmethod := action.Action + action.EntityType

	switch fqmethod {
	// case "UpdateUser":
	// case "CreateTrack", "UpdateTrack":
	default:
		logger.Info("no handler for: " + fqmethod)
	}

	err = tx.Commit()
	if err != nil {
		panic(err)
	}

}
