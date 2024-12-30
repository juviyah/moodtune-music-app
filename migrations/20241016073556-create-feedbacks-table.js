'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('feedbacks', {
            feedback_id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false
            },
            feedback_text: {
                type: Sequelize.STRING,
                allowNull: false
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Set default value to current timestamp
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('feedbacks');
    }
};
