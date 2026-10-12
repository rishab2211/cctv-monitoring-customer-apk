import authReducer, {
  setCredentials,
  setToken,
  setUser,
  logout,
} from '../src/app/slices/authSlice';

describe('authSlice reducer', () => {
  const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    role: null,
  };

  const mockUser = {
    _id: 'user-1',
    name: 'Test Customer',
    email: 'customer@example.com',
    role: 'customer' as const,
    isActive: true,
  };

  it('handles setCredentials correctly', () => {
    const nextState = authReducer(
      initialState,
      setCredentials({
        user: mockUser,
        token: 'token-abc',
        refreshToken: 'refresh-xyz',
      })
    );

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toEqual(mockUser);
    expect(nextState.token).toBe('token-abc');
    expect(nextState.refreshToken).toBe('refresh-xyz');
    expect(nextState.role).toBe('customer');
  });

  it('handles setToken correctly upon silent token refresh', () => {
    const loggedInState = {
      user: mockUser,
      token: 'old-token',
      refreshToken: 'old-refresh',
      isAuthenticated: true,
      role: 'customer',
    };

    const nextState = authReducer(
      loggedInState,
      setToken({
        token: 'new-token-123',
        refreshToken: 'new-refresh-456',
      })
    );

    expect(nextState.token).toBe('new-token-123');
    expect(nextState.refreshToken).toBe('new-refresh-456');
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toEqual(mockUser);
  });

  it('handles logout correctly', () => {
    const loggedInState = {
      user: mockUser,
      token: 'token-123',
      refreshToken: 'refresh-456',
      isAuthenticated: true,
      role: 'customer',
    };

    const nextState = authReducer(loggedInState, logout());
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(nextState.refreshToken).toBeNull();
    expect(nextState.role).toBeNull();
  });
});
