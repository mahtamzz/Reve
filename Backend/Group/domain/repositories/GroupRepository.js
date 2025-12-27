class GroupRepository {
    create(group) { throw new Error('Not implemented'); }
    findById(groupId) { throw new Error('Not implemented'); }
    listByOwner(uid) { throw new Error('Not implemented'); }

    listDiscoverable({ limit, offset }) { throw new Error('Not implemented'); }
    searchDiscoverable({ q, limit, offset }) { throw new Error('Not implemented'); }

    update(groupId, fields) { throw new Error('Not implemented'); }
    delete(groupId) { throw new Error('Not implemented'); }
}
module.exports = GroupRepository;
