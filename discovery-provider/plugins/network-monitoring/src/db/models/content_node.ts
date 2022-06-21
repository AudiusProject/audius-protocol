import { DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelizeConn } from "..";
import IndexBlock from "./index_block";

export default class ContentNode extends Model<InferAttributes<ContentNode>, InferCreationAttributes<ContentNode>> {
    declare run_id: ForeignKey<IndexBlock['run_id']>
    declare spID: number
    declare endpoint: string
}

ContentNode.belongsTo(IndexBlock)
ContentNode.init(
    {
        spID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        endpoint: {
            type: DataTypes.STRING,
        }
    },
    { tableName: 'content_nodes', sequelize: sequelizeConn }
)