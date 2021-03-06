'use strict';
import Sequelize from 'sequelize';
import dotenv from 'dotenv';

const env = dotenv.config();
const hostname = env.parsed.HOSTNAME;
const database = env.parsed.DATABASE;
const username = env.parsed.USERNAME;
const password = env.parsed.PASSWORD;

var connection = new Sequelize(database, username, password, {
    host    : hostname,
    logging : true,
    dialect : "mysql",
    pool    : {
        max:     40,
        min:     0,
        acquire: 10000000,
        idle:    100000,
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

