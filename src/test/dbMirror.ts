// @vitest-environment node
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance: any = null;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  
  const db = new Database(':memory:');
  
  const migrationPath = path.join(process.cwd(), 'src-tauri', 'migrations', '001_initial.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  db.exec(sql);
  
  dbInstance = db;
  return db;
}

function resetDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  return getDb();
}

export { getDb, resetDb };