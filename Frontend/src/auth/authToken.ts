export type TokenScope = "user" | "admin";

type TokenState = {
  user: string | null;
  admin: string | null;
};

const state: TokenState = {
  user: null,
  admin: null,
};

export const authToken = {
  set(scope: TokenScope, token: string | null) {
    state[scope] = token;
  },
  get(scope: TokenScope) {
    return state[scope];
  },
  clear(scope?: TokenScope) {
    if (scope) state[scope] = null;
    else {
      state.user = null;
      state.admin = null;
    }
  },
};
