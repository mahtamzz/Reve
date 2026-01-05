// src/hooks/useFollowMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";
import { followStatusKey } from "./useFollowStatus";

export const followersListKey = (uid: number) => ["profile", "followers", uid] as const;
export const followingListKey = (uid: number) => ["profile", "following", uid] as const;
export const followCountsKey = (uid: number) => ["profile", "followCounts", uid] as const;

export function useFollowUser(opts?: { myUid?: number }) {
  const qc = useQueryClient();
  const myUid = opts?.myUid;

  return useMutation({
    mutationFn: (targetUid: number) => profileSocialApi.follow(targetUid),

    onMutate: async (targetUid) => {
      // optimistic: set follow-status true
      await qc.cancelQueries({ queryKey: followStatusKey(targetUid) });
      const prev = qc.getQueryData<{ isFollowing: boolean }>(followStatusKey(targetUid));
      qc.setQueryData(followStatusKey(targetUid), { isFollowing: true });

      // optimistic: counts (if we have them)
      if (myUid) {
        await qc.cancelQueries({ queryKey: followCountsKey(myUid) });
        const prevCounts = qc.getQueryData<{ uid: number; followers: number; following: number }>(
          followCountsKey(myUid)
        );
        if (prevCounts) {
          qc.setQueryData(followCountsKey(myUid), {
            ...prevCounts,
            following: prevCounts.following + 1,
          });
        }
      }

      return { prev };
    },

    onError: (_err, targetUid, ctx) => {
      // rollback
      if (ctx?.prev) qc.setQueryData(followStatusKey(targetUid), ctx.prev);
    },

    onSettled: async (_data, _err, targetUid) => {
      // refresh status for truth
      await qc.invalidateQueries({ queryKey: followStatusKey(targetUid) });

      // refresh lists/counts
      if (myUid) {
        await qc.invalidateQueries({ queryKey: followCountsKey(myUid) });
        await qc.invalidateQueries({ queryKey: followingListKey(myUid) });
      }
    },
  });
}

export function useUnfollowUser(opts?: { myUid?: number }) {
  const qc = useQueryClient();
  const myUid = opts?.myUid;

  return useMutation({
    mutationFn: (targetUid: number) => profileSocialApi.unfollow(targetUid),

    onMutate: async (targetUid) => {
      await qc.cancelQueries({ queryKey: followStatusKey(targetUid) });
      const prev = qc.getQueryData<{ isFollowing: boolean }>(followStatusKey(targetUid));
      qc.setQueryData(followStatusKey(targetUid), { isFollowing: false });

      if (myUid) {
        await qc.cancelQueries({ queryKey: followCountsKey(myUid) });
        const prevCounts = qc.getQueryData<{ uid: number; followers: number; following: number }>(
          followCountsKey(myUid)
        );
        if (prevCounts) {
          qc.setQueryData(followCountsKey(myUid), {
            ...prevCounts,
            following: Math.max(0, prevCounts.following - 1),
          });
        }
      }

      return { prev };
    },

    onError: (_err, targetUid, ctx) => {
      if (ctx?.prev) qc.setQueryData(followStatusKey(targetUid), ctx.prev);
    },

    onSettled: async (_data, _err, targetUid) => {
      await qc.invalidateQueries({ queryKey: followStatusKey(targetUid) });

      if (myUid) {
        await qc.invalidateQueries({ queryKey: followCountsKey(myUid) });
        await qc.invalidateQueries({ queryKey: followingListKey(myUid) });
      }
    },
  });
}
