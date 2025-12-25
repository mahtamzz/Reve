export type User = {
    id: string;
    username: string;
    email?: string;
  };
  
  export type UserScore = {
    xp: number;
  };
  
  export type Group = {
    id: string;
    name: string;
    description: string | null;
    visibility: "public" | "private";
    weekly_xp: number | null;
    minimum_dst_mins: number | null;
    owner_uid: number;
    created_at: string;
    updated_at: string;
  };
  
  
  export type ApiOk = { ok: true };
  

export type ApiGroup = {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  weekly_xp: number | null;
  minimum_dst_mins: number | null;
  owner_uid: number;
  created_at: string;
  updated_at: string;
};
