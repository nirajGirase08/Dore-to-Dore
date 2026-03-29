import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AssistanceTransaction = sequelize.define('AssistanceTransaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  request_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  offer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  offer_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  helper_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  recipient_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  resource_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  completion_source: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'manual',
  },
  completed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'assistance_transactions',
  timestamps: false,
  indexes: [
    { fields: ['helper_user_id'] },
    { fields: ['recipient_user_id'] },
    { fields: ['conversation_id'] },
    { fields: ['request_id'] },
    { fields: ['offer_id'] },
  ],
});

export default AssistanceTransaction;
