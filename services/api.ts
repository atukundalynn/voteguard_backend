

import { 
  Position, Candidate, Voter, Vote, AuditLogEntry, 
  UserRole, CandidateStatus, VoterStatus
} from '../types';
import { db, auth, storage } from './firebase';
import { 
  collection, getDocs, addDoc, updateDoc, doc, setDoc, deleteDoc, getDoc,
  query, where, limit, writeBatch, Timestamp, orderBy 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


// Collection Names
const COLL = {
  POSITIONS: 'positions',
  CANDIDATES: 'candidates',
  VOTERS: 'voters',
  VOTES: 'votes',
  AUDIT: 'audit_logs',
  OTPS: 'otps',
  SYSTEM_USERS: 'system_users'
};


// Initial Seed Data
const SEED_POSITIONS: Position[] = [
  { 
    id: 'p1', 
    name: 'Guild President', 
    seats: 1, 
    opensAt: new Date(Date.now() - 86400000).toISOString(), 
    closesAt: new Date(Date.now() + 86400000).toISOString(),
    semester: 'Trinity',
    eligibilityRules: 'Must be a registered 3rd-year student with a GPA above 3.5. No prior disciplinary record.'
  },
  { 
    id: 'p2', 
    name: 'General Secretary', 
    seats: 1, 
    opensAt: new Date(Date.now() - 86400000).toISOString(), 
    closesAt: new Date(Date.now() + 86400000).toISOString(),
    semester: 'Trinity',
    eligibilityRules: 'Open to all 2nd and 3rd-year students. Must have served in a guild committee previously.'
  },
];
