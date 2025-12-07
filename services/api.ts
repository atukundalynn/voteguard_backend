

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
