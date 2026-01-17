import Dexie, { Table } from 'dexie';

export interface LocalFile {
  id?: number;
  userId: string;
  firestoreId: string;
  fileName: string;
  fileType: string;
  data: any;
  importedAt: Date;
}

class SolufuseDB extends Dexie {
  files!: Table<LocalFile>; 

  constructor() {
    super('SolufuseDB');
    this.version(1).stores({
      files: '++id, userId, firestoreId, importedAt' 
    });
  }
}

export const localDB = new SolufuseDB();
