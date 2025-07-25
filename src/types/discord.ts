export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export interface VerifiedUser {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  accessToken: string;
  verifiedAt: string;
  serverId?: string;
  createdAt: string;
}

export interface BotCommand {
  id: string;
  commandType: 'setup_verify' | 'pull' | 'stats';
  serverId: string;
  adminUserId: string;
  verificationUrl?: string;
  createdAt: string;
}

export interface AdminSession {
  id: string;
  sessionKey: string;
  isOwner: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface VerificationStats {
  totalVerified: number;
  recentVerifications: number;
  serverBreakdown: { serverId: string; count: number }[];
}