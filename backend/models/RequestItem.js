import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RequestItem = sequelize.define('RequestItem', {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'requests',
      key: 'request_id',
    },
  },
  resource_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  quantity_needed: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  quantity_fulfilled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'fulfilled']],
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'request_items',
  timestamps: false,
  indexes: [
    { fields: ['request_id'] },
    { fields: ['resource_type'] },
  ],
});

export default RequestItem;
