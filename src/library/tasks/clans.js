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
                data : JSON.stringify(submittedData),
                member_count : clanData.detail.memberCount
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
                                    // console.log("[UPDATED] " + JSON.stringify(member.get({plain: true})));
                                    resolve(member);
                                });
                        } else {
                            // console.log("[CREATED] " + JSON.stringify(member.get({ plain: true })));
                            resolve(member);
                        }
                    });
            });
        }));

    }

    runMulti(data) {
        let parsedData = [];
        let runs       = [];

        for(let i = 0; i < Math.ceil(data.length/15); i++) {
            parsedData.push(data.slice(i*15, i*15+15));
        }

        // We're going to want to trigger
        // sequentially to save our old
        // shitty database some more stress
        return new Promise((resolve, reject) => {
            let chain = this.run(parsedData.shift());

            for(let chunk of parsedData) {

                chain.then(results => {
                    return this.run(chunk)
                });
            }
            chain.then(() => {
                console.log('done but not resolving');
            });
        });
    }

    async run(_data = false) {     
        var data = _data ? _data : await this.getClanData();
        console.log("running with " + data.length);
        if(data.length > 15) {
            return this.runMulti(data);
        }

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
                order : [['updated_at', 'ASC']],
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
