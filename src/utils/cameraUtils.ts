import { Camera, CameraLocation } from '../types';

/**
 * Consistently determines whether the current logged-in user is the owner
 * of a given camera across all screens (Dashboard, CameraList, LiveView).
 */
export const isCameraOwner = (
  camera?: Partial<Camera> | null,
  userId?: string | null
): boolean => {
  if (!camera) return false;

  // Explicit flag from backend taking precedence
  if (camera.isOwner === true) return true;
  if (camera.isOwner === false) return false;

  // Fallback: check customerId ownership
  if (!userId) return false;

  const rawCustomerId = camera.customerId;
  const ownerId =
    typeof rawCustomerId === 'object' && rawCustomerId !== null
      ? (rawCustomerId as { _id?: string })._id
      : rawCustomerId;

  return Boolean(ownerId && ownerId === userId);
};

/**
 * Formats camera location into a clean, human-readable address string,
 * falling back gracefully through:
 * 1. location.street, city, state, pincode
 * 2. location.address
 * 3. customerId.address (from populated backend)
 * 4. franchiseId.territory (from populated backend)
 * 5. fallback string
 */
export const formatCameraLocation = (
  camera?: Partial<Camera> | null,
  fallback = 'Main Entrance / Premises'
): string => {
  if (!camera) return fallback;

  if (typeof camera.location === 'string' && camera.location.trim()) {
    return camera.location.trim();
  }

  const loc = camera.location as CameraLocation | undefined;
  if (loc && typeof loc === 'object') {
    const parts = [loc.street, loc.city, loc.state, loc.pincode].filter(
      (p): p is string => Boolean(p && typeof p === 'string' && p.trim())
    );
    if (parts.length > 0) {
      return parts.join(', ');
    }
    if (loc.address && loc.address.trim()) {
      return loc.address.trim();
    }
  }

  // Fallback to customer address if populated
  if (typeof camera.customerId === 'object' && camera.customerId !== null) {
    const custAddr = (camera.customerId as any).address;
    if (custAddr) {
      const parts = [custAddr.street, custAddr.city, custAddr.state, custAddr.pincode].filter(
        (p): p is string => Boolean(p && typeof p === 'string' && p.trim())
      );
      if (parts.length > 0) return parts.join(', ');
    }
  }

  // Fallback to franchise territory
  if (typeof camera.franchiseId === 'object' && camera.franchiseId !== null) {
    const fran = camera.franchiseId as any;
    if (fran.territory?.city || fran.territory?.state) {
      const parts = [fran.territory.city, fran.territory.state].filter(
        (p): p is string => Boolean(p && typeof p === 'string' && p.trim())
      );
      if (parts.length > 0) return parts.join(', ');
    }
  }

  return fallback;
};

/**
 * Formats relative time from a given ISO date string or timestamp.
 * Example: "Just now", "5m ago", "2h ago", "Yesterday", "MMM d"
 */
export const formatRelativeTime = (
  timestamp?: string | number | Date | null
): string => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Never';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Formats camera last ping with status and recency detection.
 */
export const formatCameraPing = (
  camera?: Partial<Camera> | null
): { text: string; isRecent: boolean; isOnline: boolean } => {
  if (!camera) return { text: 'Never', isRecent: false, isOnline: false };

  const rawPing =
    camera.lastPing ||
    camera.health?.lastPing ||
    (camera.status === 'online' ? camera.updatedAt : null);
  const isOnline = camera.status === 'online';

  if (!rawPing) {
    return { text: isOnline ? 'Online' : 'Never', isRecent: false, isOnline };
  }

  const pingDate = new Date(rawPing);
  const isValid = !isNaN(pingDate.getTime());
  if (!isValid) {
    return { text: isOnline ? 'Online' : 'Never', isRecent: false, isOnline };
  }

  const isRecent = Date.now() - pingDate.getTime() < 120_000; // 2 minutes
  return {
    text: formatRelativeTime(rawPing),
    isRecent,
    isOnline,
  };
};
