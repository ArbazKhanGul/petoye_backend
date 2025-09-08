// Types for the admin panel

export interface Admin {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  profileImage?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  dateOfBirth?: Date;
  country?: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  profileImage?: string;
  emailVerify: boolean;
  referralCode?: string;
  tokens: number;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    username: string;
    email: string;
    profileImage?: string;
  };
  content?: string;
  mediaFiles: Array<{
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
  }>;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenTransaction {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    username: string;
    email: string;
  };
  amount: number;
  type: 'like' | 'referral' | 'admin_adjustment';
  relatedId?: string;
  createdAt: Date;
}

export interface AuditLog {
  _id: string;
  adminId: {
    _id: string;
    fullName: string;
    email: string;
  };
  action: string;
  targetType?: string;
  targetId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  oldData?: any;
  newData?: any;
  createdAt: Date;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    growth: Array<{
      _id: string;
      count: number;
    }>;
    recent: User[];
  };
  posts: {
    total: number;
    analytics: {
      totalLikes: number;
      totalComments: number;
      avgLikes: number;
      avgComments: number;
    };
    recent: Post[];
  };
  tokens: {
    transactions: number;
    distribution: {
      totalTokens: number;
      avgTokens: number;
      maxTokens: number;
      minTokens: number;
    };
  };
  referrals: {
    total: number;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  pagination?: Pagination;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  admin: Admin;
  authToken: string;
  refreshToken: string;
}
