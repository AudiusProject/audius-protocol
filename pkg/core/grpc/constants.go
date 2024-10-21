package grpc

import (
	"reflect"

	gen_proto "github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
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
	TrackPlaysProtoName = GetProtoTypeName(&gen_proto.TrackPlays{})
	ManageEntitiesProtoName = GetProtoTypeName(&gen_proto.ManageEntityLegacy{})
	SlaRollupProtoName = GetProtoTypeName(&gen_proto.SlaRollup{})
	SlaNodeReportProtoName = GetProtoTypeName(&gen_proto.SlaNodeReport{})
}

func GetProtoTypeName(msg proto.Message) string {
	return strcase.ToSnake(reflect.TypeOf(msg).Elem().Name())
}
