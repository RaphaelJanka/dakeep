import { Injectable, inject } from '@angular/core';
import { Note } from '../interfaces/note.interface';
import { Firestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, where, limit, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {

  trashNotes: Note[] = [];
  normalNotes: Note[] = [];
  markedNotes: Note[] = [];
  firestore: Firestore = inject(Firestore);

  unsubTrash;
  unsubNotes;
  unsubMarkedNotes;

  constructor() {
    this.unsubNotes = this.subNotesList();
    this.unsubTrash = this.subTrashList();
    this.unsubMarkedNotes = this.subMarkedNotesList();
  }


  async addNote(item: Note, colId: "notes" | "trash") {
    if (colId == "notes"){
    await addDoc(this.getNotesRef(), item)
      .catch((err) => {
        console.error(err);
      }) 
      .then((docRef) => {
        console.log('Document written with ID: ', docRef?.id);
      });
    } else {
      await addDoc(this.getTrashRef(), item)
      .catch((err) => {
        console.error(err);
      }) 
      .then((docRef) => {
        console.log('Document written with ID: ', docRef?.id);
      });
    }
  }
  
  async updateNote(note: Note) {
    if(note.id) {
      let docRef = this.getSingleDocRef(this.getCollIDFromNote(note), note.id)
      await updateDoc(docRef, this.getCleanJSON(note)).catch(
        (err) => {console.error(err);}
      );
    }
  }

  async deleteNote(collID: "notes" | "trash", docID:string) {
    await deleteDoc(this.getSingleDocRef(collID, docID)).catch(
      (err) => {console.error(err);
      }
    )
  }

  getCollIDFromNote(note: Note) {
    if (note.type == "note") {
      return "notes";
    } else {
       return "trash";
    }
  }

  getCleanJSON(note: Note) {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked,
    }
  }
  ngonDestroy(){
    this.unsubTrash();
    this.unsubNotes();
    this.unsubMarkedNotes();
  }

  subNotesList() {
    const q = query(this.getNotesRef(), orderBy('title'), limit(100));
    return onSnapshot(q, (list) => {
      this.normalNotes = [];
      list.forEach(element => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
      list.docChanges().forEach((change) => {
        if (change.type === "added") {
            console.log("New note: ", change.doc.data());
        }
        if (change.type === "modified") {
            console.log("Modified note: ", change.doc.data());
        }
        if (change.type === "removed") {
            console.log("Removed note: ", change.doc.data());
        }
      });
    } );
  }
  subMarkedNotesList() {
    const q = query(this.getNotesRef(), where("marked","==", true), limit(100));
    return onSnapshot(q, (list) => {
      this.markedNotes = [];
      list.forEach(element => {
        this.markedNotes.push(this.setNoteObject(element.data(), element.id));
      });
    } );
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach(element => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
      });
    } );
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getNotesRef() {
    return collection(this.firestore, 'notes');
  }

  getSingleDocRef(collID:string, docID:string) {
    	return doc(collection(this.firestore, collID), docID);
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id,
      type: obj.type || "note",
      title: obj.title || "",
      content: obj.content || "",
      marked: obj.marked || false
    }
  }
}
