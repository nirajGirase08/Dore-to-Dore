import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RideRequest = sequelize.define('RideRequest', {
  ride_request_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  requester_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  pickup_lat: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
  pickup_lng: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
  pickup_address: { type: DataTypes.TEXT, allowNull: true },
  destination_lat: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
  destination_lng: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
  destination_address: { type: DataTypes.TEXT, allowNull: true },
  urgency: {
    type: DataTypes.STRING(20),
    defaultValue: 'urgent',
    validate: { isIn: [['emergency', 'urgent', 'normal']] },
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.STRING(30),
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'accepted', 'en_route', 'picked_up', 'completed', 'cancelled']] },
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  accepted_at: { type: DataTypes.DATE, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'ride_requests',
  timestamps: false,
});

export default RideRequest;
