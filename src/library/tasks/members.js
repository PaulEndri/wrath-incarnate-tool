'use strict';
import clanList from '../../data/clans';
import MembershipLibrary from '../../library/clan/membership';
import _BungieMember from '../database/models/bungieMember';
import _BungieMembership from '../database/models/bungieMembership';

export default class Members {
    constructor(db) {
        this.db = db;
    }

    async refreshGroupMembers(members, bungieMembers) {
        const BungieMember = _BungieMember(this.db);
        let transaction    = await this.db.transaction();
        let delayCount     = 0;
        
        let promises = members.map(membership => {
            let delayedAmt = delayCount * 50;
            delayCount++;

            return new Promise(async (resolve, reject) => {
                await new Promise(resolve => setTimeout(resolve(delayCount), delayedAmt));
                let membershipLibrary   = new MembershipLibrary(membership);
                let bungieMemberProfile = await membershipLibrary.getProfile();
                let destinyId           = membership.destiny_member_id;

                if (!bungieMemberProfile || bungieMemberProfile === undefined) {
                    console.warn("[WARNING] The following user id could not be found in bungie's systems " + membership.id);

                    return resolve();
                }

                let memberData = bungieMemberProfile.profile.data;
                let update     = {
                    deleted:     false,
                    name:        memberData.userInfo.displayName,
                    last_seen:   memberData.dateLastPlayed,
                    type:        membership.membership_type,
                    bungie_id:   membership.bungie_member_id,
                    destiny_id:  destinyId,
                    type:        membership.membership_type,
                    data:        JSON.stringify({
                        profile: memberData
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

    async run(groupId) {
        const memberWhere      = { group_id : groupId}
        const BungieMembership = _BungieMembership(this.db);
        const BungieMember     = _BungieMember(this.db);
        let _memberships       = await BungieMembership.findAll({ where: memberWhere, raw: true });
        let _bungieMembers     = await BungieMember.findAll();
        let delayCount         = 0;
        var bungieMembers      = {};
        var groupedMemberships = {};

        await this.db.query("update bungie_member set deleted = 1");

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

        return new Promise(async (_resolve, _reject) => {
            let groupedPromises = [];

            for(var groupId in groupedMemberships) {
                let memberships = groupedMemberships[groupId];
                let delayedAmt  = delayCount*3000;
                delayCount++;

                await new Promise(resolve => setTimeout(resolve(), delayedAmt));
                groupedPromises.push(this.refreshGroupMembers(memberships, bungieMembers));
            }

            Promise
                .all(groupedPromises)
                .then(async r => {
                    await this.db.query("update bungie_membership ms join bungie_member m on m.destiny_id = ms.destiny_member_id set ms.member_id = m.id, ms.deleted = m.deleted");
                    _resolve(r);
                })
                .catch(e => {
                    console.log(e);
                    _reject(e);
                });
        });
    }
}
