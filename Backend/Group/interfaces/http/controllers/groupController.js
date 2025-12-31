function createGroupController(useCases) {
    const {
        createGroup,
        deleteGroup,
        getGroupDetails,
        joinGroup,
        leaveGroup,
        updateGroup,
        approveJoinRequest,
        rejectJoinRequest,
        changeMemberRole,
        kickMember,
        listGroups,
        searchGroups,
        getMyMembership
    } = useCases;

    return {
        async create(req, res, next) {
            try {
                const group = await createGroup.execute({
                    uid: req.user.uid,
                    ...req.body
                });

                res.status(201).json(group);
            } catch (err) {
                next(err);
            }
        },

        async remove(req, res, next) {
            try {
                await deleteGroup.execute({
                    uid: req.user.uid,
                    groupId: req.params.groupId
                });

                res.status(204).send();
            } catch (err) {
                next(err);
            }
        },

        async getDetails(req, res, next) {
            try {
                const result = await getGroupDetails.execute({
                    uid: req.user.uid,
                    groupId: req.params.groupId
                });

                res.json(result);
            } catch (err) {
                next(err);
            }
        },

        async join(req, res, next) {
            try {
                const result = await joinGroup.execute({
                    uid: req.user.uid,
                    groupId: req.params.groupId
                });

                res.json(result);
            } catch (err) {
                next(err);
            }
        },

        async leave(req, res, next) {
            try {
                await leaveGroup.execute({
                    uid: req.user.uid,
                    groupId: req.params.groupId
                });

                res.status(204).send();
            } catch (err) {
                next(err);
            }
        },

        async update(req, res, next) {
            try {
                const updated = await updateGroup.execute({
                    uid: req.user.uid,
                    groupId: req.params.groupId,
                    fields: req.body
                });

                res.json(updated);
            } catch (err) {
                next(err);
            }
        },

        async approveJoin(req, res, next) {
            try {
                await approveJoinRequest.execute({
                    actorUid: req.user.uid,
                    targetUid: req.params.userId,
                    groupId: req.params.groupId
                });

                res.status(204).send();
            } catch (err) {
                next(err);
            }
        },

        async rejectJoin(req, res, next) {
            try {
                await rejectJoinRequest.execute({
                    actorUid: req.user.uid,
                    targetUid: req.params.userId,
                    groupId: req.params.groupId
                });

                res.status(204).send();
            } catch (err) {
                next(err);
            }
        },

        async changeRole(req, res, next) {
            try {
                await changeMemberRole.execute({
                    actorUid: req.user.uid,
                    targetUid: req.params.userId,
                    groupId: req.params.groupId,
                    role: req.body.role
                });

                res.status(204).send();
            } catch (err) {
                next(err);
            }
        },

        async kick(req, res, next) {
            try {
                await kickMember.execute({
                    actorUid: req.user.uid,
                    targetUid: req.params.userId,
                    groupId: req.params.groupId
                });

                res.status(204).send();
            } catch (err) {
                next(err);
            }
        },

        async list(req, res, next) {
            try {
                const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
                const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

                const groups = await listGroups.execute({
                    viewerUid: req.user.uid,
                    limit,
                    offset
                });

                res.json(groups);
            } catch (err) {
                next(err);
            }
        },

        async search(req, res, next) {
            try {
                const q = req.query.q || '';
                const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
                const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

                const groups = await searchGroups.execute({
                    viewerUid: req.user.uid,
                    q,
                    limit,
                    offset
                });

                res.json(groups);
            } catch (err) {
                next(err);
            }
        },

        async getMyMembership(req, res, next) {
            try {
                const groupId = req.params.groupId;
                const uid = req.user.uid;

                const result = await getMyMembership.execute({ groupId, uid });

                res.json(result);
            } catch (err) {
                next(err);
            }
        },

    };
};

module.exports = createGroupController;