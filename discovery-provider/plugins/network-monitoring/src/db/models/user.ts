import { DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelizeConn } from "..";
import type ContentNode from "./content_node";
import IndexBlock from "./index_block";

export default class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare run_id: ForeignKey<IndexBlock['run_id']>
    declare userid: number
    declare wallet: string
    declare clockValue: number
    declare replica_set: Array<string>
    declare primarySpID: ForeignKey<ContentNode['spID']>
    declare secondary1SpID: ForeignKey<ContentNode['spID']>
    declare secondary2SpID: ForeignKey<ContentNode['spID']>

}

User.belongsTo(IndexBlock)
User.init(
    {
        userid: {
            type: DataTypes.INTEGER,
        },
        wallet: {
            type: DataTypes.TEXT,
        },
        clockValue: {
            type: DataTypes.INTEGER,
        },
        replica_set: {
            type: DataTypes.ARRAY,
        },
    },
    { tableName: 'users', sequelize: sequelizeConn }
)