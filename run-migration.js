// Quick script to run indexes + foreign keys directly
const { Client } = require('pg');
require('dotenv').config();

const sql = `
-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "zones_name_key" ON "zones"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "zones_code_key" ON "zones"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "states_code_key" ON "states"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "polling_units_code_key" ON "polling_units"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_state_id_idx" ON "users"("state_id");
CREATE INDEX IF NOT EXISTS "users_lga_id_idx" ON "users"("lga_id");
CREATE INDEX IF NOT EXISTS "users_ward_id_idx" ON "users"("ward_id");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX IF NOT EXISTS "messages_target_level_idx" ON "messages"("target_level");
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages"("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "message_recipients_message_id_user_id_key" ON "message_recipients"("message_id", "user_id");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
CREATE INDEX IF NOT EXISTS "tasks_assigned_to_level_idx" ON "tasks"("assigned_to_level");
CREATE UNIQUE INDEX IF NOT EXISTS "events_qr_code_token_key" ON "events"("qr_code_token");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events"("status");
CREATE INDEX IF NOT EXISTS "events_scheduled_at_idx" ON "events"("scheduled_at");
CREATE UNIQUE INDEX IF NOT EXISTS "event_attendees_event_id_user_id_key" ON "event_attendees"("event_id", "user_id");
CREATE INDEX IF NOT EXISTS "activity_uploads_uploader_id_idx" ON "activity_uploads"("uploader_id");
CREATE INDEX IF NOT EXISTS "activity_uploads_activity_type_idx" ON "activity_uploads"("activity_type");
CREATE INDEX IF NOT EXISTS "donations_donor_id_idx" ON "donations"("donor_id");
CREATE INDEX IF NOT EXISTS "donations_status_idx" ON "donations"("status");
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "media_library_type_idx" ON "media_library"("type");
CREATE INDEX IF NOT EXISTS "media_library_visibility_idx" ON "media_library"("visibility");
CREATE INDEX IF NOT EXISTS "incident_reports_severity_idx" ON "incident_reports"("severity");
CREATE INDEX IF NOT EXISTS "incident_reports_status_idx" ON "incident_reports"("status");
CREATE INDEX IF NOT EXISTS "volunteer_tasks_assigned_to_idx" ON "volunteer_tasks"("assigned_to");
CREATE INDEX IF NOT EXISTS "volunteer_tasks_status_idx" ON "volunteer_tasks"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "badges_name_key" ON "badges"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");
CREATE UNIQUE INDEX IF NOT EXISTS "survey_responses_survey_id_respondent_id_key" ON "survey_responses"("survey_id", "respondent_id");
CREATE INDEX IF NOT EXISTS "gotv_assignments_volunteer_id_idx" ON "gotv_assignments"("volunteer_id");
CREATE INDEX IF NOT EXISTS "gotv_assignments_status_idx" ON "gotv_assignments"("status");

-- Foreign Keys (wrapped in DO blocks to skip if exists)
DO $$ BEGIN ALTER TABLE "states" ADD CONSTRAINT "states_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "lgas" ADD CONSTRAINT "lgas_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "wards" ADD CONSTRAINT "wards_lga_id_fkey" FOREIGN KEY ("lga_id") REFERENCES "lgas"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "polling_units" ADD CONSTRAINT "polling_units_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_lga_id_fkey" FOREIGN KEY ("lga_id") REFERENCES "lgas"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_polling_unit_id_fkey" FOREIGN KEY ("polling_unit_id") REFERENCES "polling_units"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "message_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "message_recipients" ADD CONSTRAINT "message_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "message_recipients" ADD CONSTRAINT "message_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "activity_uploads" ADD CONSTRAINT "activity_uploads_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "activity_uploads" ADD CONSTRAINT "activity_uploads_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "activity_uploads" ADD CONSTRAINT "activity_uploads_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "donations" ADD CONSTRAINT "donations_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "media_library" ADD CONSTRAINT "media_library_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_polling_unit_id_fkey" FOREIGN KEY ("polling_unit_id") REFERENCES "polling_units"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "volunteer_tasks" ADD CONSTRAINT "volunteer_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "volunteer_tasks" ADD CONSTRAINT "volunteer_tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "gotv_assignments" ADD CONSTRAINT "gotv_assignments_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "gotv_assignments" ADD CONSTRAINT "gotv_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

async function run() {
  console.log('🔗 Connecting to Neon...');
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();
  console.log('✅ Connected! Running migration...');
  
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  let ok = 0, skip = 0, fail = 0;
  
  for (const stmt of statements) {
    try {
      await client.query(stmt + ';');
      ok++;
      process.stdout.write('.');
    } catch (e) {
      if (e.message.includes('already exists')) { skip++; process.stdout.write('s'); }
      else { fail++; console.error('\n❌', e.message.slice(0, 80)); }
    }
  }
  
  console.log(`\n\n✅ Done! ${ok} applied, ${skip} skipped (already exist), ${fail} failed`);
  await client.end();
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
