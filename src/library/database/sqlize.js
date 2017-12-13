'use strict';
import Sequelize from 'sequelize';

const hostname = 'db.paulendri.com';
const database = 'winpixelpub';
const username = 'winpixelpub';
const password = 'wrathIncarnate';

var connection = new Sequelize(database, username, password, {
    host    : hostname,
    dialect : "mysql",
    pool    : {
        max:     30,
        min:     0,
        acquire: 1000000,
        idle:    10000,
        timeout: 10000000
    },
    define : {
        paranoid:        false,
        timestamps:      true,
        freezeTableName: true,
        underscored:     true
      }
});

export default connection;

