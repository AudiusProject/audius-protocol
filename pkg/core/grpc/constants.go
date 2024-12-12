package grpc

import (
	"reflect"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/iancoleman/strcase"
	"google.golang.org/protobuf/proto"
)

var (
	TrackPlaysProtoName     string
	ManageEntitiesProtoName string
	SlaRollupProtoName      string
	SlaNodeReportProtoName  string
)

func init() {
	TrackPlaysProtoName = GetProtoTypeName(&core_proto.TrackPlays{})
	ManageEntitiesProtoName = GetProtoTypeName(&core_proto.ManageEntityLegacy{})
	SlaRollupProtoName = GetProtoTypeName(&core_proto.SlaRollup{})
	SlaNodeReportProtoName = GetProtoTypeName(&core_proto.SlaNodeReport{})
}

func GetProtoTypeName(msg proto.Message) string {
	return strcase.ToSnake(reflect.TypeOf(msg).Elem().Name())
}
