'use strict';
import clanList from '../../data/clans';
import ClanLibrary from '../../library/clan/clan';
import _BungieClan from '../database/models/bungieClan';
import _BungieMembership from '../database/models/bungieMembership';

export default class Clans {
    constructor(db, limit = 0) {
        let clans = clanList;

        this.clans = clanList;
        this.limit = limit
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

    refreshMemberships(members, clanId, groupId, t) {
        const BungieMembership = _BungieMembership(this.db);        

        return Promise.all(members.map(clanMember => {
            let where = {
                destiny_member_id : clanMember.destinyUserInfo.membershipId
            };
    
            let defaults = {
                clan_id:         clanId,
                bungie_clan_id:  groupId,
                membership_type: clanMember.destinyUserInfo.membershipType
            };

            if(clanMember.bungieNetUserInfo !== undefined) {
                where.bungie_member_id = clanMember.bungieNetUserInfo.membershipId
            }

            let _queryObject = {
                where:      where,
                defaults:   defaults,
                transction: t
            };

            return new Promise((resolve, reject) => {
                BungieMembership
                    .findOrCreate(_queryObject)
                    .spread((member, created) => {
                        if(created === false) {
                            member
                                .update(defaults)
                                .then(() => {
                                    console.log("[UPDATED] " + JSON.stringify(member.get({plain: true})));
                                    resolve(member);
                                });
                        } else {
                            console.log("[CREATED] " + JSON.stringify(member.get({ plain: true })));
                            resolve(member);
                        }
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
                                    .refreshMemberships(clanData.members, clan.id, clanData.detail.groupId, t)
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
        let clans = this.clans;

        if(this.limit != 0) {
            const BungieClan = _BungieClan(this.db);
            let queryObject  = {
                order : 'updated_at ASC',
                limit : this.limit
            };

            clans = await BungieClan.findAll(queryObject);
        }

        return await Promise.all(
            clans.map(bungieClan => {
                let clan = this.limit ? bungieClan.get({plain: true}) : {id : bungieClan};

                return new ClanLibrary(clan.id).getData();
            })
        );
    }
}
