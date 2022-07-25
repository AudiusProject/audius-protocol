import { DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelizeConn } from "..";
import IndexBlock from "./index_block";
import type User from "./user";

export default class CID_From_DN extends Model<InferAttributes<CID_From_DN>, InferCreationAttributes<CID_From_DN>> {
    declare run_id: ForeignKey<IndexBlock['run_id']>
    declare userid: ForeignKey<User['userid']>
    declare cid: string
}

CID_From_DN.belongsTo(IndexBlock)
CID_From_DN.init(
    {
        cid: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
    },
    { tableName: 'cids_from_dn', sequelize: sequelizeConn }
)