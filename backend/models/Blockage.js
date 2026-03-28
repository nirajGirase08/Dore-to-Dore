import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Blockage = sequelize.define('Blockage', {
  blockage_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reported_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  blockage_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [['tree_down', 'flooding', 'ice', 'power_line', 'debris', 'road_closure', 'accident', 'other']],
    },
  },
  severity: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']],
    },
  },
  location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  location_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  location_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  photo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
  },
  authority_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notified_at: {
    type: DataTypes.DATE,
    allowNull: true,
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
  tableName: 'blockages',
  timestamps: false,
});

Blockage.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });

export default Blockage;
