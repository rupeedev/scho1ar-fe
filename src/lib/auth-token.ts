// Token manager for API client
// This allows the API client to get tokens without being in a React context

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export const authTokenManager = {
  setTokenGetter: (getter: TokenGetter) => {
    tokenGetter = getter;
  },

  getToken: async (): Promise<string | null> => {
    if (!tokenGetter) {
      console.warn('Token getter not initialized');
      return null;
    }
    return tokenGetter();
  },

  clearTokenGetter: () => {
    tokenGetter = null;
  }
};
