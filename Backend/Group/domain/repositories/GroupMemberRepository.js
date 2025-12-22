class GroupMemberRepository {
    addMember(groupId, uid, role) {
        throw new Error('Not implemented');
    }

    removeMember(groupId, uid) {
        throw new Error('Not implemented');
    }

    getMembers(groupId) {
        throw new Error('Not implemented');
    }

    getUserGroups(uid) {
        throw new Error('Not implemented');
    }

    getRole(groupId, uid) {
        throw new Error('Not implemented');
    }
}

module.exports = GroupMemberRepository;
