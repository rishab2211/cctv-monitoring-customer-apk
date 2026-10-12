import { isCameraOwner } from '../src/utils/cameraUtils';

describe('isCameraOwner', () => {
  const mockUserId = 'user-123';

  it('returns false when camera is null or undefined', () => {
    expect(isCameraOwner(null, mockUserId)).toBe(false);
    expect(isCameraOwner(undefined, mockUserId)).toBe(false);
  });

  it('respects explicit isOwner flag from backend', () => {
    expect(isCameraOwner({ isOwner: true }, mockUserId)).toBe(true);
    expect(isCameraOwner({ isOwner: false, customerId: mockUserId }, mockUserId)).toBe(false);
  });

  it('matches when customerId is a string matching userId', () => {
    expect(isCameraOwner({ customerId: 'user-123' }, 'user-123')).toBe(true);
    expect(isCameraOwner({ customerId: 'user-999' }, 'user-123')).toBe(false);
  });

  it('matches when customerId is a populated object with _id matching userId', () => {
    const cameraWithPopulatedCustomer = {
      customerId: {
        _id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      },
    };
    expect(isCameraOwner(cameraWithPopulatedCustomer as any, 'user-123')).toBe(true);
    expect(isCameraOwner(cameraWithPopulatedCustomer as any, 'user-456')).toBe(false);
  });

  it('returns false when userId is not provided and isOwner is not explicitly true', () => {
    expect(isCameraOwner({ customerId: 'user-123' }, null)).toBe(false);
    expect(isCameraOwner({ customerId: 'user-123' }, undefined)).toBe(false);
  });
});
