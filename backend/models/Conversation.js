import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Conversation = sequelize.define('Conversation', {
  conversation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'requests', key: 'request_id' },
  },
  offer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'offers', key: 'offer_id' },
  },
  participant_1_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  participant_2_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
  },
  last_message_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'conversations',
  timestamps: false,
});

export default Conversation;
