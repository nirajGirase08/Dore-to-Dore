import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['male', 'female', 'prefer_not_to_answer']],
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
  user_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'student',
    validate: {
      isIn: [['student', 'staff', 'faculty']],
    },
  },
  profile_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reputation_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: false,
  indexes: [
    {
      fields: ['email'],
    },
    {
      fields: ['location_lat', 'location_lng'],
    },
  ],
});

// Instance method to get safe user data (without password)
User.prototype.toSafeObject = function() {
  const { password_hash, ...safeUser } = this.toJSON();
  return safeUser;
};

export default User;
