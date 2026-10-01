import { Account, Client, ID, Query, Realtime, TablesDB } from 'appwrite';

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6abde6d5001e5d6b6f6f';
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6abde7900033286b49a9';
export const APPWRITE_TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID || '6abde7ca0027e5e77e33';

export const appwriteClient = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(appwriteClient);
export const tablesDB = new TablesDB(appwriteClient);
export const realtime = new Realtime(appwriteClient);
export { ID, Query };
