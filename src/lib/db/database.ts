import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file location
const DB_PATH = path.join(process.cwd(), 'data', 'trip.db');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Singleton database connection
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db && db.open) {
    return db;
  }

  ensureDataDir();

  db = new Database(DB_PATH);

  // Performance optimizations
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000');
  db.pragma('temp_store = memory');
  db.pragma('busy_timeout = 5000');

  // Initialize schema
  initializeSchema(db);

  return db;
}

function initializeSchema(db: Database.Database) {
  // Visited locations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visited (
      location_id TEXT PRIMARY KEY,
      visited INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      location_id TEXT PRIMARY KEY,
      note TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Day plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS day_plans (
      date TEXT PRIMARY KEY,
      ordered_activities TEXT NOT NULL,
      departure_time TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Custom activities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_activities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      date TEXT NOT NULL,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Sync metadata table (track last sync per client)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// Visited locations
export function getVisitedState(): Record<string, boolean> {
  const db = getDatabase();
  const rows = db.prepare('SELECT location_id, visited FROM visited').all() as Array<{ location_id: string; visited: number }>;
  const result: Record<string, boolean> = {};
  for (const row of rows) {
    result[row.location_id] = row.visited === 1;
  }
  return result;
}

export function setVisited(locationId: string, visited: boolean): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO visited (location_id, visited, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(location_id) DO UPDATE SET
      visited = excluded.visited,
      updated_at = excluded.updated_at
  `).run(locationId, visited ? 1 : 0);
}

// Notes
export function getNotesState(): Record<string, string> {
  const db = getDatabase();
  const rows = db.prepare('SELECT location_id, note FROM notes').all() as Array<{ location_id: string; note: string }>;
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.location_id] = row.note;
  }
  return result;
}

export function setNote(locationId: string, note: string): void {
  const db = getDatabase();
  if (note) {
    db.prepare(`
      INSERT INTO notes (location_id, note, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(location_id) DO UPDATE SET
        note = excluded.note,
        updated_at = excluded.updated_at
    `).run(locationId, note);
  } else {
    db.prepare('DELETE FROM notes WHERE location_id = ?').run(locationId);
  }
}

// Day plans
export interface DayPlanDB {
  date: string;
  orderedActivities: string[];
  departureTime?: string;
}

export function getDayPlans(): Record<string, DayPlanDB> {
  const db = getDatabase();
  const rows = db.prepare('SELECT date, ordered_activities, departure_time FROM day_plans').all() as Array<{
    date: string;
    ordered_activities: string;
    departure_time: string | null;
  }>;
  const result: Record<string, DayPlanDB> = {};
  for (const row of rows) {
    result[row.date] = {
      date: row.date,
      orderedActivities: JSON.parse(row.ordered_activities),
      departureTime: row.departure_time || undefined,
    };
  }
  return result;
}

export function setDayPlan(plan: DayPlanDB): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO day_plans (date, ordered_activities, departure_time, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(date) DO UPDATE SET
      ordered_activities = excluded.ordered_activities,
      departure_time = excluded.departure_time,
      updated_at = excluded.updated_at
  `).run(plan.date, JSON.stringify(plan.orderedActivities), plan.departureTime || null);
}

// Custom activities
export interface CustomActivityDB {
  id: string;
  name: string;
  lat: number;
  lng: number;
  date: string;
  address?: string;
}

export function getCustomActivities(): CustomActivityDB[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT id, name, lat, lng, date, address FROM custom_activities').all() as Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    date: string;
    address: string | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    date: row.date,
    address: row.address || undefined,
  }));
}

export function addCustomActivity(activity: CustomActivityDB): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO custom_activities (id, name, lat, lng, date, address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      lat = excluded.lat,
      lng = excluded.lng,
      date = excluded.date,
      address = excluded.address
  `).run(activity.id, activity.name, activity.lat, activity.lng, activity.date, activity.address || null);
}

export function removeCustomActivity(activityId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM custom_activities WHERE id = ?').run(activityId);
}

// Get all data for sync
export function getAllData() {
  return {
    visited: getVisitedState(),
    notes: getNotesState(),
    dayPlans: getDayPlans(),
    customActivities: getCustomActivities(),
  };
}

// Bulk import data (for initial sync from client)
export function importAllData(data: {
  visited?: Record<string, boolean>;
  notes?: Record<string, string>;
  dayPlans?: Record<string, DayPlanDB>;
  customActivities?: CustomActivityDB[];
}): void {
  const db = getDatabase();

  const importTransaction = db.transaction(() => {
    // Import visited
    if (data.visited) {
      for (const [locationId, visited] of Object.entries(data.visited)) {
        setVisited(locationId, visited);
      }
    }

    // Import notes
    if (data.notes) {
      for (const [locationId, note] of Object.entries(data.notes)) {
        setNote(locationId, note);
      }
    }

    // Import day plans
    if (data.dayPlans) {
      for (const plan of Object.values(data.dayPlans)) {
        setDayPlan(plan);
      }
    }

    // Import custom activities
    if (data.customActivities) {
      for (const activity of data.customActivities) {
        addCustomActivity(activity);
      }
    }
  });

  importTransaction();
}
