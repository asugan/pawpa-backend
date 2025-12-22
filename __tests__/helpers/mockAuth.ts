// Mock auth middleware için helper
export interface MockAuthUser {
  userId: string;
  email?: string;
  name?: string;
}

export const mockAuth = (userId?: string): MockAuthUser => ({
  userId: userId || 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
});
