import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OfferItem = sequelize.define('OfferItem', {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  offer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'offers',
      key: 'offer_id',
    },
  },
  resource_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  quantity_total: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity_remaining: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'available',
    validate: {
      isIn: [['available', 'claimed', 'given']],
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'offer_items',
  timestamps: false,
  indexes: [
    { fields: ['offer_id'] },
    { fields: ['resource_type'] },
  ],
});

export default OfferItem;
