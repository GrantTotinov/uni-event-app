import { Pool } from 'pg'

export const pool = new Pool({
  user: process.env.EXPO_PUBLIC_NILE_DB_USERNAME,
  password: process.env.EXPO_PUBLIC_NILE_DB_PASSWORD,
  host: 'us-west-2.db.thenile.dev',
  port: 5432,
  database: 'uni_event_app',
})
