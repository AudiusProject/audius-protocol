import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelizeConn } from "..";

export default class IndexBlock extends Model<InferAttributes<IndexBlock>, InferCreationAttributes<IndexBlock>> {
    declare run_id: number
    declare is_current: boolean
    declare blocknumber: string
    declare is_complete: boolean
    declare createdAt: string
}

IndexBlock.init(
    {
        run_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        is_current: {
            type: DataTypes.BOOLEAN,
        },
        blocknumber: {
            type: DataTypes.INTEGER,
        },
        is_complete: {
            type: DataTypes.BOOLEAN,
        },
        createdAt: {
            type: DataTypes.TIME,
        },
    },
    { tableName: 'index_blocks', sequelize: sequelizeConn }
)