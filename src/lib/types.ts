import { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  isMember: boolean;
  isAdmin: boolean;
  claimedByUID: string | null;
  guestSessionCount: number;
  membershipPromptDismissed: boolean;
  createdAt: Timestamp;
  createdBy: string;
}

export interface AttendanceRecord {
  attended: boolean;
  intending: boolean;
  paid: boolean;
  amountOwed: number;
}

export interface Session {
  id: string;
  sessionNumber: number;
  date: Timestamp;
  attendance: Record<string, AttendanceRecord>;
}

export interface AppConfig {
  sessionRate: number;
  bankDetails: {
    accountName: string;
    bsb: string;
    accountNumber: string;
  };
  guestSessionLimit: number;
}

export interface PlayerWithClaim extends Player {
  amountOwed?: number;
}
