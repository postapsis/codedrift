/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
import Database from "better-sqlite3";
import os from "node:os";
import path from "node:path";
import { mkdirSync } from "node:fs";

const directory = path.join(os.homedir(), ".config", "codedrift");
mkdirSync(directory, { recursive: true });

export const db: Database.Database = new Database(path.join(directory, "codedrift.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    base_branch TEXT NOT NULL,
    head_branch TEXT NOT NULL,
    created_date TEXT NOT NULL DEFAULT (datetime('now')),
    repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE
  );
`);
