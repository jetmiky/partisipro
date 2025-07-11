export interface SystemConfiguration {
  id: string;
  category: 'fees' | 'limits' | 'kyc' | 'blockchain' | 'payments' | 'system';
  key: string;
  value: any;
  description: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'investment' | 'profit' | 'governance' | 'system' | 'kyc';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readAt?: Date;
}
