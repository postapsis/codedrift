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
    name TEXT NOT NULL,
    overview TEXT,
    created_date TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS review_repositories (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    base_ref TEXT NOT NULL,
    head_ref TEXT NOT NULL,
    UNIQUE (review_id, repository_id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS changesets (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS changeset_files (
    id TEXT PRIMARY KEY,
    changeset_id TEXT NOT NULL REFERENCES changesets(id) ON DELETE CASCADE,
    repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    summary TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS changeset_file_comments (
    id TEXT PRIMARY KEY,
    changeset_file_id TEXT NOT NULL REFERENCES changeset_files(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    side TEXT NOT NULL DEFAULT 'new' CHECK (side IN ('old', 'new')),
    comment TEXT NOT NULL
  );
`);
