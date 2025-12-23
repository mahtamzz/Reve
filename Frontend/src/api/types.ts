export type User = {
    id: string;
    username: string;
    email?: string;
  };
  
  export type UserScore = {
    score: number;
  };
  
  export type Group = {
    id: string;
    name: string;
    membersCount?: number;
  };
  
  export type ApiOk = { ok: true };
  