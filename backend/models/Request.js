import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Request = sequelize.define('Request', {
  request_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  urgency_level: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']],
    },
  },
  location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  location_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  location_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  target_gender: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['male', 'female']],
    },
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'in_progress', 'partially_fulfilled', 'fulfilled', 'cancelled']],
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'requests',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['location_lat', 'location_lng'] },
    { fields: ['urgency_level'] },
  ],
});

export default Request;
