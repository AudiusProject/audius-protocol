import { DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelizeConn } from "..";
import type ContentNode from "./content_node";
import IndexBlock from "./index_block";
import type User from "./user";

export default class CID_From_CN extends Model<InferAttributes<CID_From_CN>, InferCreationAttributes<CID_From_CN>> {
    declare run_id: ForeignKey<IndexBlock['run_id']>
    declare userid: ForeignKey<User['userid']>
    declare content_node_spID: ForeignKey<ContentNode['spID']>
    declare cid: string
}

CID_From_CN.belongsTo(IndexBlock)
CID_From_CN.init(
    {
        cid: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
    },
    { tableName: 'cids_from_cn', sequelize: sequelizeConn }
)