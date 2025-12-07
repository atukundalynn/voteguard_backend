export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICER = 'OFFICER',
  CANDIDATE = 'CANDIDATE',
  VOTER = 'VOTER',
  GUEST = 'GUEST'
}

export enum CandidateStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum VoterStatus {
  ELIGIBLE = 'ELIGIBLE',
  VERIFIED = 'VERIFIED', // Has OTP/Token
  VOTED = 'VOTED',
  BLOCKED = 'BLOCKED'
}

export type Semester = 'Advent' | 'Trinity' | 'Easter';

export interface Position {
  id: string;
  name: string;
  seats: number;
  opensAt: string;
  closesAt: string;
  semester: Semester;
  eligibilityRules: string;
}

export interface Candidate {
  id: string;
  positionId: string;
  name: string;
  regNo: string; // Registration Number
  manifesto: string; // URL or text
  photoUrl: string;
  status: CandidateStatus;
  reason?: string; // For rejection
  createdAt: string;
}

export interface Voter {
  id: string;
  regNo: string;
  name: string;
  email: string;
  program: string;
  status: VoterStatus;
  token?: string; // Session token
}



export interface Vote {
  id: string;
  positionId: string;
  candidateId: string;
  castAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorType: UserRole;
  actorId: string; // Name or ID
  action: string;
  details: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  token?: string; // For voters
}