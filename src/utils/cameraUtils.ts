import { Camera } from '../types';

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
