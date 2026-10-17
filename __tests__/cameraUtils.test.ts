import {
  isCameraOwner,
  formatCameraLocation,
  formatRelativeTime,
  formatCameraPing,
} from '../src/utils/cameraUtils';

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

describe('formatCameraLocation', () => {
  it('returns fallback when camera or location is empty', () => {
    expect(formatCameraLocation(null)).toBe('Main Entrance / Premises');
    expect(formatCameraLocation({})).toBe('Main Entrance / Premises');
    expect(formatCameraLocation({}, 'Custom Default')).toBe('Custom Default');
  });

  it('formats location from street, city, state, pincode parts', () => {
    const camera = {
      location: {
        street: '123 Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
    };
    expect(formatCameraLocation(camera as any)).toBe(
      '123 Market Street, Mumbai, Maharashtra, 400001'
    );
  });

  it('falls back to location.address if street and city are empty', () => {
    const camera = {
      location: {
        address: 'Warehouse Gate 2',
      },
    };
    expect(formatCameraLocation(camera as any)).toBe('Warehouse Gate 2');
  });

  it('falls back to customer address when camera location is not set', () => {
    const camera = {
      customerId: {
        _id: 'cust-1',
        name: 'John Doe',
        address: {
          street: '45 Residency Rd',
          city: 'Bangalore',
          state: 'Karnataka',
        },
      },
    };
    expect(formatCameraLocation(camera as any)).toBe('45 Residency Rd, Bangalore, Karnataka');
  });

  it('falls back to franchise territory when camera location and customer address are missing', () => {
    const camera = {
      franchiseId: {
        _id: 'fran-1',
        name: 'North Delhi CCTV Franchise',
        territory: {
          city: 'Delhi',
          state: 'Delhi',
        },
      },
    };
    expect(formatCameraLocation(camera as any)).toBe('Delhi, Delhi');
  });
});

describe('formatRelativeTime and formatCameraPing', () => {
  it('formats relative time correctly', () => {
    expect(formatRelativeTime(null)).toBe('Never');
    expect(formatRelativeTime(undefined)).toBe('Never');

    const now = Date.now();
    expect(formatRelativeTime(now - 10_000)).toBe('Just now');
    expect(formatRelativeTime(now - 120_000)).toBe('2m ago');
    expect(formatRelativeTime(now - 7_200_000)).toBe('2h ago');
  });

  it('formats camera ping status and detects recency', () => {
    expect(formatCameraPing(null)).toEqual({
      text: 'Never',
      isRecent: false,
      isOnline: false,
    });

    const recentDate = new Date(Date.now() - 30_000).toISOString();
    const cameraOnline = {
      status: 'online',
      lastPing: recentDate,
    };
    const pingOnline = formatCameraPing(cameraOnline as any);
    expect(pingOnline.isOnline).toBe(true);
    expect(pingOnline.isRecent).toBe(true);
    expect(pingOnline.text).toBe('Just now');

    const oldDate = new Date(Date.now() - 3_600_000).toISOString();
    const cameraOffline = {
      status: 'offline',
      lastPing: oldDate,
    };
    const pingOffline = formatCameraPing(cameraOffline as any);
    expect(pingOffline.isOnline).toBe(false);
    expect(pingOffline.isRecent).toBe(false);
    expect(pingOffline.text).toBe('1h ago');
  });
});
