// src/hooks/useFollowMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";
import { followStatusKey } from "./useFollowStatus";

type FollowCounts = { uid: number; followers: number; following: number };
type FollowStatus = { isFollowing: boolean };

function safeUid(uid?: number) {
  return typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;
}

export const followersListKey = (uid: number) => ["profile", "followers", uid] as const;
export const followingListKey = (uid: number) => ["profile", "following", uid] as const;
export const followCountsKey = (uid: number) => ["profile", "followCounts", uid] as const;

function bumpCounts(
  qc: ReturnType<typeof useQueryClient>,
  uid: number,
  patch: Partial<Pick<FollowCounts, "followers" | "following">>
) {
  const prev = qc.getQueryData<FollowCounts>(followCountsKey(uid));
  if (!prev) return null;

  qc.setQueryData<FollowCounts>(followCountsKey(uid), {
    ...prev,
    followers:
      patch.followers == null ? prev.followers : Math.max(0, patch.followers),
    following:
      patch.following == null ? prev.following : Math.max(0, patch.following),
  });

  return prev;
}

export function useFollowUser(opts?: { myUid?: number }) {
  const qc = useQueryClient();
  const myUid = safeUid(opts?.myUid);

  return useMutation({
    mutationFn: (targetUid: number) => {
      const t = safeUid(targetUid);
      if (!t) return Promise.reject(new Error("invalid target uid"));
      return profileSocialApi.follow(t);
    },

    onMutate: async (targetUidRaw) => {
      const targetUid = safeUid(targetUidRaw);
      if (!targetUid) return {};

      // 1) optimistic follow status
      await qc.cancelQueries({ queryKey: followStatusKey(targetUid) });
      const prevStatus = qc.getQueryData<FollowStatus>(followStatusKey(targetUid));
      qc.setQueryData<FollowStatus>(followStatusKey(targetUid), { isFollowing: true });

      // 2) optimistic counts
      let prevMyCounts: FollowCounts | null = null;
      let prevTargetCounts: FollowCounts | null = null;

      if (myUid) {
        await qc.cancelQueries({ queryKey: followCountsKey(myUid) });
        prevMyCounts = bumpCounts(qc, myUid, {
          following: (qc.getQueryData<FollowCounts>(followCountsKey(myUid))?.following ?? 0) + 1,
        });
      }

      await qc.cancelQueries({ queryKey: followCountsKey(targetUid) });
      prevTargetCounts = bumpCounts(qc, targetUid, {
        followers: (qc.getQueryData<FollowCounts>(followCountsKey(targetUid))?.followers ?? 0) + 1,
      });

      return { targetUid, prevStatus, prevMyCounts, prevTargetCounts };
    },

    onError: (_err, _targetUid, ctx) => {
      const targetUid = (ctx as any)?.targetUid as number | undefined;
      if (!targetUid) return;

      // rollback status
      if ((ctx as any)?.prevStatus) {
        qc.setQueryData(followStatusKey(targetUid), (ctx as any).prevStatus);
      }

      // rollback counts
      const prevMyCounts = (ctx as any)?.prevMyCounts as FollowCounts | null | undefined;
      const prevTargetCounts = (ctx as any)?.prevTargetCounts as FollowCounts | null | undefined;

      if (prevMyCounts) qc.setQueryData(followCountsKey(prevMyCounts.uid), prevMyCounts);
      if (prevTargetCounts) qc.setQueryData(followCountsKey(prevTargetCounts.uid), prevTargetCounts);
    },

    onSettled: async (_data, _err, targetUidRaw) => {
      const targetUid = safeUid(targetUidRaw);
      if (!targetUid) return;

      // ensure truth
      await qc.invalidateQueries({ queryKey: followStatusKey(targetUid) });
      await qc.invalidateQueries({ queryKey: followCountsKey(targetUid) });

      // refresh my side
      if (myUid) {
        await qc.invalidateQueries({ queryKey: followCountsKey(myUid) });
        await qc.invalidateQueries({ queryKey: followingListKey(myUid) });
      }

      // refresh their followers list too (اگر جایی کش شده باشد)
      await qc.invalidateQueries({ queryKey: followersListKey(targetUid) });
    },
  });
}

export function useUnfollowUser(opts?: { myUid?: number }) {
  const qc = useQueryClient();
  const myUid = safeUid(opts?.myUid);

  return useMutation({
    mutationFn: (targetUid: number) => {
      const t = safeUid(targetUid);
      if (!t) return Promise.reject(new Error("invalid target uid"));
      return profileSocialApi.unfollow(t);
    },

    onMutate: async (targetUidRaw) => {
      const targetUid = safeUid(targetUidRaw);
      if (!targetUid) return {};

      // 1) optimistic follow status
      await qc.cancelQueries({ queryKey: followStatusKey(targetUid) });
      const prevStatus = qc.getQueryData<FollowStatus>(followStatusKey(targetUid));
      qc.setQueryData<FollowStatus>(followStatusKey(targetUid), { isFollowing: false });

      // 2) optimistic counts
      let prevMyCounts: FollowCounts | null = null;
      let prevTargetCounts: FollowCounts | null = null;

      if (myUid) {
        await qc.cancelQueries({ queryKey: followCountsKey(myUid) });
        const current = qc.getQueryData<FollowCounts>(followCountsKey(myUid));
        prevMyCounts = bumpCounts(qc, myUid, {
          following: (current?.following ?? 0) - 1,
        });
      }

      await qc.cancelQueries({ queryKey: followCountsKey(targetUid) });
      const currentT = qc.getQueryData<FollowCounts>(followCountsKey(targetUid));
      prevTargetCounts = bumpCounts(qc, targetUid, {
        followers: (currentT?.followers ?? 0) - 1,
      });

      return { targetUid, prevStatus, prevMyCounts, prevTargetCounts };
    },

    onError: (_err, _targetUid, ctx) => {
      const targetUid = (ctx as any)?.targetUid as number | undefined;
      if (!targetUid) return;

      if ((ctx as any)?.prevStatus) {
        qc.setQueryData(followStatusKey(targetUid), (ctx as any).prevStatus);
      }

      const prevMyCounts = (ctx as any)?.prevMyCounts as FollowCounts | null | undefined;
      const prevTargetCounts = (ctx as any)?.prevTargetCounts as FollowCounts | null | undefined;

      if (prevMyCounts) qc.setQueryData(followCountsKey(prevMyCounts.uid), prevMyCounts);
      if (prevTargetCounts) qc.setQueryData(followCountsKey(prevTargetCounts.uid), prevTargetCounts);
    },

    onSettled: async (_data, _err, targetUidRaw) => {
      const targetUid = safeUid(targetUidRaw);
      if (!targetUid) return;

      await qc.invalidateQueries({ queryKey: followStatusKey(targetUid) });
      await qc.invalidateQueries({ queryKey: followCountsKey(targetUid) });

      if (myUid) {
        await qc.invalidateQueries({ queryKey: followCountsKey(myUid) });
        await qc.invalidateQueries({ queryKey: followingListKey(myUid) });
      }

      await qc.invalidateQueries({ queryKey: followersListKey(targetUid) });
    },
  });
}
