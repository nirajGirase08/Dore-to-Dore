import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Blockage from './Blockage.js';

const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  notification_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // 'blockage_alert'  → high/critical, shown as full-page banner
    // 'blockage_nearby' → low/medium within 1 mile, shown in bell dropdown
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  severity: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_dismissed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'notifications',
  timestamps: false,
});

// related_id points to a blockage — used to check if blockage is resolved
Notification.belongsTo(Blockage, { foreignKey: 'related_id', as: 'relatedBlockage' });

export default Notification;
