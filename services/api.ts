

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


const SEED_CANDIDATES: Candidate[] = [
  { id: 'c1', positionId: 'p1', name: 'Alice Walker', regNo: 'M23B15/001', manifesto: 'Better campus Wi-Fi for everyone!', photoUrl: 'https://picsum.photos/id/64/200/200', status: CandidateStatus.APPROVED, createdAt: new Date().toISOString() },
  { id: 'c2', positionId: 'p1', name: 'Bob Smith', regNo: 'S23B12/002', manifesto: 'More library hours.', photoUrl: 'https://picsum.photos/id/65/200/200', status: CandidateStatus.APPROVED, createdAt: new Date().toISOString() },
  { id: 'c3', positionId: 'p2', name: 'Charlie Brown', regNo: 'J23B15/003', manifesto: 'Transparency in funds.', photoUrl: 'https://picsum.photos/id/66/200/200', status: CandidateStatus.SUBMITTED, createdAt: new Date().toISOString() },
  { id: 'c4', positionId: 'p2', name: 'Diana Prince', regNo: 'M24B13/004', manifesto: 'Student wellness programs.', photoUrl: 'https://picsum.photos/id/67/200/200', status: CandidateStatus.APPROVED, createdAt: new Date().toISOString() },
];

const PROGRAMS = ['BSc Computer Science', 'Bachelor of Laws', 'BBA', 'BEd', 'BSc Nursing'];

const generateRegNo = (index: number): string => {
  const prefixes = ['M24B13', 'S23B12', 'J23B15'];
  const prefix = prefixes[index % prefixes.length];
  const number = (index + 1).toString().padStart(3, '0');
  return `${prefix}/${number}`;
};

// Helper to ensure authentication before any DB call
const ensureAuth = async () => {
    if (!auth.currentUser) {
        try {
            await signInAnonymously(auth);
        } catch (e) {
            console.error("Auto-auth failed", e);
        }
    }
};


// Helper to seed data if empty
const ensureInitialized = async () => {
  await ensureAuth();

  try {
    const posSnap = await getDocs(collection(db, COLL.POSITIONS));
    if (!posSnap.empty) return;

    console.log('Seeding Database...');
    const batch = writeBatch(db);

    SEED_POSITIONS.forEach(p => {
      const ref = doc(db, COLL.POSITIONS, p.id);
      batch.set(ref, p);
    });

    SEED_CANDIDATES.forEach(c => {
      const ref = doc(db, COLL.CANDIDATES, c.id);
      batch.set(ref, c);
    });

        // Seed 100 voters in batch
    for (let i = 0; i < 100; i++) {
      const v = {
        id: `v${i}`,
        regNo: generateRegNo(i),
        name: `Student ${i + 1}`,
        email: `student${i}@uni.edu`,
        program: PROGRAMS[i % PROGRAMS.length],
        status: i < 5 ? VoterStatus.VOTED : VoterStatus.ELIGIBLE,
        createdAt: new Date().toISOString()
      };
      const ref = doc(db, COLL.VOTERS, v.id);
      batch.set(ref, v);
    }

    await batch.commit();
    console.log('Database Seeded.');
  } catch (e) {
    console.error("Database initialization failed:", e);
  }
};