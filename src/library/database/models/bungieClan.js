'use strict';
import sqlize from '../sqlize';
import Sqlize from 'Sequelize';

export default sqlize.define('bungie_clan', {
    data:         Sqlize.TEXT,
    deleted:      Sqlize.BOOLEAN,
    group_id:     Sqlize.INTEGER,
    id:           Sqlize.INTEGER,
    last_queried: Sqlize.DATE,
    name:         Sqlize.STRING
});