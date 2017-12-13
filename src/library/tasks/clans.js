'use strict';
import clanList from '../../data/clans';
import ClanLibrary from '../../library/clan/clan';
import _BungieClan from '../database/models/bungieClan';
import _BungieMembership from '../database/models/bungieMembership';

export default class Clans {
    constructor(db, limit = 0) {
        let clans = clanList;
        
        if(limit !== 0 && !isNaN(limit)) {
            clans = clans.slice(0, limit);
        }

        this.clans = clans;
        this.db = db;
    }

    async refreshClan(clanData, t) {
        const BungieClan  = _BungieClan(this.db);        
        let groupId       = clanData.detail.groupId;
        let submittedData = Object.assign({}, clanData, {members : null});
        let queryObject   = {
            where : {
                group_id : groupId,
                name     : clanData.detail.name,
            },
            defaults : {
                data : JSON.stringify(submittedData)
            },
            transaction : t
        }

        return await BungieClan
            .findOrCreate(queryObject)
            .spread((clan, created) => {
                return clan;
            })
            .catch(e => {
                console.log(e);
            });
    }

    refreshMembers(members, clanId, groupId, t) {
        const BungieMembership = _BungieMembership(this.db);        

        return Promise.all(members.map(clanMember => {
            let where = {
                destiny_member_id : clanMember.destinyUserInfo.membershipId
            };
    
            if(clanMember.bungieNetUserInfo !== undefined) {
                where.bungie_member_id = clanMember.bungieNetUserInfo.membershipId
            }

            let _queryObject = {
                where : where,
                defaults : {
                    clan_id : clanId,
                    bungie_clan_id : groupId
                },
                transction : t
            };

            return new Promise((resolve, reject) => {
                BungieMembership
                    .findOrCreate(_queryObject)
                    .spread((member, created) => {
                        resolve(member);
                    });
            });
        }));

    }

    async run() {     
        var data = await this.getClanData();

        return new Promise((_resolve, _reject) => {
            var clanPromises = data.map(clanData => {
                return new Promise((resolve, reject) => {
                    this
                        .db
                        .transaction()
                        .then(async t => {
                            let clan = await this.refreshClan(clanData, t);
                            
                            try {
                                this
                                    .refreshMembers(clanData.members, clan.id, clanData.detail.groupId, t)
                                    .then(results => {
                                        return t.commit();
                                    })
                                    .then(() => {
                                        resolve();
                                    });
                            }
                            catch(e) {
                                t.rollback().then(() => reject(e));
                            }
 
                            
                        });
                });
            });


            Promise
                .all(clanPromises)
                .then(r => {
                    _resolve(r);
                })
                .catch(e => {
                    _reject(e)
                });
        });
                
    }

    async getClanData() {
        return await Promise.all(
            this.clans.map(
                clanId => new ClanLibrary(clanId).getData()
            )
        );
    }
}
