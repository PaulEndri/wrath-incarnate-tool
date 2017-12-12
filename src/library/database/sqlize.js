'use strict';
import Sequelize from 'sequelize';
const hostname = 'db.paulendri.com';
const database = 'winpixelpub';
const username = 'winpixelpub';
const password = 'wrathIncarnate';

export default new Sequelize(database, username, password, {
    host    : hostname,
    dialect : mysql,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});


