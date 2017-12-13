'use strict';
import clanList from '../../data/clans';
import MembershipLibrary from '../../library/clan/membership';
import _BungieMember from '../database/models/bungieMember';
import _BungieMembership from '../database/models/bungieMembership';

export default class Members {
    constructor(db) {
        this.db = db;
    }

    async run() {     
        const BungieMembership = _BungieMembership(this.db);
        const BungieMember     = _BungieMember(this.db);        
        let members            = await BungieMembership.findAll();

        return new Promise((_resolve, _reject) => {
            let promises = members.map(membership => {
                membership = membership.get({plain:true});

                let membershipLibrary = new MembershipLibrary(membership);

                return new Promise(async (resolve, reject) => {
                    let bungieMemberProfile = await membershipLibrary.getProfile();

                    if(!bungieMemberProfile || bungieMemberProfile === undefined) {
                        console.warn("[WARNING] The following user id could not be found in bungie's systems " + membership.id);
                        
                        return resolve();
                    }

                    let memberData = bungieMemberProfile.profile.data;

                    let query = {
                        where  : {
                            destiny_id : membership.destiny_member_id
                        },
                        defaults : {
                            data : "{}"
                        }
                    };

                    BungieMember
                        .findOrCreate(query)
                        .spread((member, created) => {
                            let data = member.data ? JSON.parse(member.data) : {};
                            let update = {
                                name      : memberData.userInfo.displayName,
                                last_seen : memberData.dateLastPlayed,
                                type      : membership.membership_type,
                                bungie_id : membership.bungie_member_id,
                                type      : membership.membership_type,
                                data      : JSON.stringify(Object.assign({},data, {
                                    profile : memberData
                                }))
                            };

                            member
                                .update(update)
                                .then(_member => {
                                    resolve(member);
                                })
                                .catch(e => {
                                    console.log(e);
                                    reject(e);
                                })
                        })
                        .catch(e => {
                            console.log(e);
                            reject(e);  
                        });

                })
            });

            Promise.all(promises)
                .then(results => {
                    _resolve(results);
                })
                .catch(e => {
                    _reject(e);
                })
        });
                
    }
}
