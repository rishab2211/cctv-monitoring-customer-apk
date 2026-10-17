export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'franchise' | 'operator';
  avatar?: string;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  franchiseId?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'pending_payment' | 'expired';

export interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  billingCycle?: string;
  features?: string[];
  [key: string]: any;
}

export interface Subscription {
  _id: string;
  customerId: string;
  planId: string | SubscriptionPlan;
  planName?: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amount: number;
  autoRenew: boolean;
}

export interface CameraLocation {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Camera {
  _id: string;
  name: string;
  serialNumber: string;
  rtspUrl?: string;
  location?: CameraLocation | string;
  status: 'online' | 'offline' | 'maintenance';
  customerId: string | {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    [key: string]: any;
  };
  customerName?: string;
  franchiseName?: string;
  franchiseId?: string | {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    territory?: {
      city?: string;
      state?: string;
      zone?: string;
    };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  operatorIds?: (string | { _id: string; name?: string; email?: string; phone?: string })[];
  isOwner?: boolean;
  sharedWith?: Array<{
    userId: string;
    email: string;
    sharedAt: string;
  }>;
  health?: {
    cpuUsage?: number;
    memoryUsage?: number;
    temperature?: number;
    storageUsage?: number;
    lastPing?: string;
  };
  lastPing?: string;
  settings?: {
    recordingEnabled?: boolean;
    motionDetection?: boolean;
    motionDetectionEnabled?: boolean;
    aiEnabled?: boolean;
    aiFeaturesEnabled?: boolean;
    recordingRetentionDays?: number;
    talkbackEnabled?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SOSAlert {
  _id: string;
  triggeredBy: string | User;
  cameraId?: string | Camera;
  location?:
    | string
    | {
        latitude?: number;
        longitude?: number;
        address?: string;
      };
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  acknowledgedBy?: string | User;
  acknowledgedAt?: string;
  resolvedBy?: string | User;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface Incident {
  _id: string;
  title: string;
  description: string;
  type: 'theft' | 'vandalism' | 'technical_issue' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string | User;
  cameraId?: string | Camera;
  attachments?: Array<{
    url: string;
    fileType: string;
    fileName: string;
  }>;
  notes?: Array<{
    _id: string;
    author: string | User;
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber?: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'general' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdBy: string | User;
  assignedTo?: string | User;
  comments?: Array<{
    _id: string;
    sender: string | User;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'system' | 'message';
  isRead: boolean;
  data?: {
    link?: string;
    entityId?: string;
    entityType?: string;
  };
  createdAt: string;
}

export interface NotificationPreferences {
  alerts: {
    push: boolean;
    inApp: boolean;
    email: boolean;
  };
  system: {
    push: boolean;
    inApp: boolean;
    email: boolean;
  };
}

export interface Session {
  _id: string;
  sessionId: string;
  deviceName?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  os?: string;
  browser?: string;
  ipAddress?: string;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

