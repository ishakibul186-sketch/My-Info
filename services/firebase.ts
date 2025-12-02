import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, remove, update, DataSnapshot } from 'firebase/database';
import { Note } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDCF9-QchK4cVsQH6IwFN1ZNl3be0-lI50",
  authDomain: "shakibul-islam-ltd-server.firebaseapp.com",
  databaseURL: "https://shakibul-islam-ltd-server-default-rtdb.firebaseio.com",
  projectId: "shakibul-islam-ltd-server",
  storageBucket: "shakibul-islam-ltd-server.appspot.com",
  messagingSenderId: "896191957877",
  appId: "1:896191957877:web:5c41a87a8fbb0c14a5e13c",
  measurementId: "G-BLW3ZJVHL5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Path: My Note Tool/(userid)/(rANDOM KEY)/jason
// We will interpret "jason" as the object structure stored at the key.

export const subscribeToNotes = (userId: string, callback: (notes: Note[]) => void) => {
  const notesRef = ref(db, `My Note Tool/${userId}`);
  
  return onValue(notesRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    
    // Filter out settings keys like 'listStatus' so they aren't treated as notes
    const notesList: Note[] = Object.keys(data)
      .filter(key => key !== 'listStatus') 
      .map(key => ({
        id: key,
        ...data[key]
      }));
    
    // Sort by timestamp desc by default
    notesList.sort((a, b) => b.timestamp - a.timestamp);
    
    callback(notesList);
  });
};

export const subscribeToViewMode = (userId: string, callback: (mode: 'grid' | 'list') => void) => {
  const refPath = ref(db, `My Note Tool/${userId}/listStatus`);
  return onValue(refPath, (snapshot) => {
    const val = snapshot.val();
    if (val === 'grid' || val === 'list') {
      callback(val);
    } else {
      callback('list'); // Default to list view as requested
    }
  });
};

export const saveViewMode = async (userId: string, mode: 'grid' | 'list') => {
  const refPath = ref(db, `My Note Tool/${userId}/listStatus`);
  await set(refPath, mode);
};

export const saveNote = async (userId: string, note: Omit<Note, 'id' | 'timestamp'> & { id?: string }) => {
  if (note.id) {
    // Update existing
    const noteRef = ref(db, `My Note Tool/${userId}/${note.id}`);
    await update(noteRef, {
      name: note.name,
      title: note.title,
      message: note.message,
      timestamp: Date.now() // Update timestamp on edit
    });
    return note.id;
  } else {
    // Create new
    const listRef = ref(db, `My Note Tool/${userId}`);
    const newNoteRef = push(listRef);
    await set(newNoteRef, {
      name: note.name,
      title: note.title,
      message: note.message,
      isFavorite: note.isFavorite || false,
      timestamp: Date.now()
    });
    return newNoteRef.key;
  }
};

export const deleteNote = async (userId: string, noteId: string) => {
  const noteRef = ref(db, `My Note Tool/${userId}/${noteId}`);
  await remove(noteRef);
};

export const toggleFavorite = async (userId: string, noteId: string, currentStatus: boolean) => {
  const noteRef = ref(db, `My Note Tool/${userId}/${noteId}`);
  await update(noteRef, {
    isFavorite: !currentStatus
  });
};