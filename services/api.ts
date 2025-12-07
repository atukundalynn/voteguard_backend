

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

// Initialize on load
ensureInitialized();

const logAction = async (actorType: UserRole, actorId: string, action: string, details: string) => {
  try {
    const entry: Omit<AuditLogEntry, 'id'> = {
      actorType,
      actorId,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, COLL.AUDIT), entry);
  } catch (e) {
    console.error('Audit Log Failed', e);
  }
};


export const api = {
  // --- Auth & Verification ---
  loginUser: async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; name?: string; message?: string }> => {
    // 1. Static Credential Validation (Enforce Exam Requirements for Role Assignment)
    let role: UserRole | undefined;
    let name: string | undefined;

    if (email === 'admin@elections.ucu.ac.ug' && password === 'admin123') {
      role = UserRole.ADMIN;
      name = 'Election Admin';
    } else if (email === 'officer@elections.ucu.ac.ug' && password === 'officer123') {
      role = UserRole.OFFICER;
      name = 'Returning Officer';
    } else {
      return { success: false, message: 'Invalid credentials. Please check your email and password.' };
    }

    // 2. Firebase Authentication (Capture Credential in Cloud)
    try {
        // Sign out any anonymous user first
        if (auth.currentUser) {
            await signOut(auth);
        }

        try {
            // Attempt standard login
            await signInWithEmailAndPassword(auth, email, password);
        } catch (loginError: any) {
            // If user doesn't exist yet (First run), create them
            if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/invalid-login-credentials') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                // Real password error
                throw loginError;
            }
        }

        // 3. Capture User Details in Firestore
        if (auth.currentUser) {
            await setDoc(doc(db, COLL.SYSTEM_USERS, auth.currentUser.uid), {
                uid: auth.currentUser.uid,
                email,
                name,
                role,
                lastLogin: new Date().toISOString()
            }, { merge: true });
        }

        return { success: true, role, name };
    } catch (e: any) {
        console.error("Firebase Auth Error:", e);
        return { success: false, message: `Authentication Error: ${e.message}` };
    }
  },

  
  requestOtp: async (regNo: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    await ensureAuth();
    
    // Sanitize RegNo for Firestore ID (replace / with _)
    const safeId = regNo.replace(/\//g, '_');

    const q = query(collection(db, COLL.VOTERS), where('regNo', '==', regNo));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { success: false, message: 'Student ID not found in eligibility list.' };
    
    const voterDoc = snapshot.docs[0];
    const voter = voterDoc.data() as Voter;

    if (voter.status === VoterStatus.BLOCKED) return { success: false, message: 'Voter is blocked.' };
    if (voter.status === VoterStatus.VOTED) return { success: false, message: 'You have already voted.' };

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Firestore using safe ID
    await setDoc(doc(db, COLL.OTPS, safeId), { 
      pin, 
      createdAt: new Date().toISOString() 
    });

    logAction(UserRole.VOTER, regNo, 'OTP_GENERATED', 'In-App PIN generated');
    
    return { success: true, message: 'Identity verified.', otp: pin };
  },
