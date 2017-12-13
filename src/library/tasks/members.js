'use strict';
import clanList from '../../data/clans';
import MembershipLibrary from '../../library/clan/membership';
import _BungieMember from '../database/models/bungieMember';
import _BungieMembership from '../database/models/bungieMembership';
var count = 0;
var max = 0;
export default class Members {
    constructor(db) {
        this.db = db;
    }

    async refreshGroupMembers(members, bungieMembers) {
        const BungieMember = _BungieMember(this.db);
        let transaction    = await this.db.transaction();

        let promises = members.map(membership => {
            return new Promise(async (resolve, reject) => {
                let membershipLibrary   = new MembershipLibrary(membership);
                let bungieMemberProfile = await membershipLibrary.getProfile();
                let destinyId           = membership.destiny_member_id;

                count++;
                console.log(`[UPDATE] Processing ${destinyId} - ${count}/${max}`);

                if (!bungieMemberProfile || bungieMemberProfile === undefined) {
                    count++;
                    console.warn("[WARNING] The following user id could not be found in bungie's systems " + membership.id);

                    return resolve();
                }

                let memberData = bungieMemberProfile.profile.data;
                let update     = {
                    name:      memberData.userInfo.displayName,
                    last_seen: memberData.dateLastPlayed,
                    type:      membership.membership_type,
                    bungie_id: membership.bungie_member_id,
                    type:      membership.membership_type,
                    data:      JSON.stringify({
                        profile : memberData
                    })
                };

                if(bungieMembers[destinyId]) {
                    let _member = bungieMembers[destinyId];
                    let data    = _member.data ? JSON.parse(_member.data) : {};

                    update.data = JSON.stringify(Object.assign({}, data, {
                        profile: memberData
                    }));
                    
                    let results = await _member.update(update, {transaction : transaction});
                    return resolve(results.get({plain: true}));
                }

                return resolve(
                    await BungieMember.create(update, {transaction : transaction})
                );
            });
        });

        return new Promise((_resolve, _reject) => {
            Promise
                .all(promises)
                .then(results => {
                    return transaction.commit().then(()=>{_resolve()});
                })
                .catch(e => {
                    console.log(e);
                    return transaction.rollBack().then(()=>{_resolve()});
                });
            });
    }

    async run() {     
        const BungieMembership = _BungieMembership(this.db);
        const BungieMember     = _BungieMember(this.db);
        let _memberships       = await BungieMembership.findAll({ raw: true });
        let _bungieMembers     = await BungieMember.findAll();
        var bungieMembers      = {};
        var groupedMemberships = {};

        _memberships.map(_membership => {
            let groupId = _membership.group_id;

            if(!groupedMemberships[groupId]) {
                groupedMemberships[groupId] = [_membership];
            } else {
                groupedMemberships[groupId].push(_membership);
            }
        });

        _bungieMembers.map(member => {
            bungieMembers[member.destiny_id] = member;
        });

        max = _memberships.length;

        return new Promise((_resolve, _reject) => {
            let groupedPromises = [];

            for(var groupId in groupedMemberships) {
                let memberships = groupedMemberships[groupId];

                groupedPromises.push(this.refreshGroupMembers(memberships, bungieMembers));
            }

            Promise
                .all(groupedPromises)
                .then(r => {
                    _resolve(r);
                })
                .catch(e => {
                    console.log(e);
                    _reject(e);
                });
        });
    }
}
