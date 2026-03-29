import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AssistanceFeedback = sequelize.define('AssistanceFeedback', {
  feedback_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  reviewer_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reviewee_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  was_helpful: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'assistance_feedback',
  timestamps: false,
  indexes: [
    { fields: ['transaction_id'], unique: true },
    { fields: ['reviewer_user_id'] },
    { fields: ['reviewee_user_id'] },
  ],
});

export default AssistanceFeedback;
