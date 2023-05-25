package server

import (
	"mediorum/crudr"
	"mediorum/ddl"
	"time"

	"golang.org/x/exp/slog"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Blob struct {
	Key       string    `json:"key" gorm:"primaryKey;not null;default:null"`
	Host      string    `json:"host" gorm:"primaryKey;not null;default:null"`
	CreatedAt time.Time `json:"created_at"`
}

type Upload struct {
	ID string `json:"id"` // base32 file hash

	Template     JobTemplate    `json:"template"`
	OrigFileName string         `json:"orig_filename"`
	OrigFileCID  string         `json:"orig_file_cid" gorm:"column:orig_file_cid;index:idx_uploads_orig_file_cid"` //
	FFProbe      *FFProbeResult `json:"probe" gorm:"serializer:json"`
	Error        string         `json:"error,omitempty"`
	Mirrors      []string       `json:"mirrors" gorm:"serializer:json"`
	Status       string         `json:"status" gorm:"index"`

	CreatedBy string    `json:"created_by" `
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime:false"`

	TranscodedBy      string    `json:"transcoded_by"`
	TranscodeProgress float64   `json:"transcode_progress"`
	TranscodedAt      time.Time `json:"transcoded_at"`

	TranscodeResults map[string]string `json:"results" gorm:"serializer:json"`

	// UpldateULID - this is the last ULID that change this thing
}

type ServerHealth struct {
	Host      string    `json:"host" gorm:"primaryKey;not null;default:null"`
	StartedAt time.Time `json:"started_at"`
	AliveAt   time.Time `json:"alive_at"`
	Version   string    `json:"version"`
	BuiltAt   string    `json:"built_at"`
}

type LogLine struct {
	ID        string `gorm:"primaryKey"`
	Host      string `gorm:"not null"`
	Message   string
	CreatedAt time.Time `gorm:"index"`
}

func dbMustDial(dbPath string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dbPath), &gorm.Config{
		SkipDefaultTransaction: true,
	})
	if err != nil {
		panic(err)
	}

	sqlDb, _ := db.DB()
	sqlDb.SetMaxOpenConns(50)

	// db = db.Debug()

	return db
}

func dbMigrate(crud *crudr.Crudr) {
	// Migrate the schema
	slog.Info("db: gorm automigrate")
	err := crud.DB.AutoMigrate(&Blob{}, &Upload{}, &ServerHealth{}, &LogLine{})
	if err != nil {
		panic(err)
	}

	// register any models to be managed by crudr
	crud.RegisterModels(&LogLine{}, &Blob{}, &Upload{}, &ServerHealth{})

	sqlDb, _ := crud.DB.DB()

	slog.Info("db: ddl migrate")
	ddl.Migrate(sqlDb)

	slog.Info("db: migrate done")

}
