const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
username: {
    primaryKey: true,
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
},
email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
},
password: {
    type: DataTypes.STRING,
    allowNull: false
},
age: {
    type: DataTypes.INTEGER,
    allowNull: true
},
role: {
    type: DataTypes.STRING,
    allowNull: false
},
status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
}
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;