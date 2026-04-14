-- Quest Board: D&D Session Scheduler
-- Initial database schema

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dm_member_id UUID,  -- set after DM member row is created
  invite_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_parties_invite_token ON parties(invite_token);

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  class_icon TEXT NOT NULL DEFAULT 'fighter',
  is_dm BOOLEAN DEFAULT false,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(party_id, character_name)
);

CREATE INDEX idx_members_party_id ON members(party_id);
CREATE INDEX idx_members_session_token ON members(session_token);

-- Now add the FK for dm_member_id
ALTER TABLE parties
  ADD CONSTRAINT fk_parties_dm_member
  FOREIGN KEY (dm_member_id) REFERENCES members(id) ON DELETE SET NULL;

CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL DEFAULT 'one-off'
    CHECK (quest_type IN ('one-off', 'recurring')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'decided', 'archived')),
  decided_slot JSONB,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quests_party_id ON quests(party_id);

CREATE TABLE quest_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  slot_date DATE,
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  CONSTRAINT valid_slot_type CHECK (
    (slot_date IS NOT NULL AND day_of_week IS NULL) OR
    (slot_date IS NULL AND day_of_week IS NOT NULL)
  )
);

CREATE INDEX idx_quest_time_slots_quest_id ON quest_time_slots(quest_id);

CREATE TABLE availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES quest_time_slots(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'maybe', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(quest_id, member_id, slot_id)
);

CREATE INDEX idx_availability_quest_member ON availability_responses(quest_id, member_id);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_party_id ON chat_messages(party_id, created_at);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_parties_updated_at
  BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_availability_updated_at
  BEFORE UPDATE ON availability_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper: get the current member's party IDs from session token header
CREATE OR REPLACE FUNCTION get_member_party_ids()
RETURNS SETOF UUID AS $$
  SELECT party_id FROM members
  WHERE session_token = current_setting('request.headers', true)::json->>'x-session-token';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current session is DM of a party
CREATE OR REPLACE FUNCTION is_dm_of(p_party_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE party_id = p_party_id
      AND is_dm = true
      AND session_token = current_setting('request.headers', true)::json->>'x-session-token'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Parties: members can read their own parties, anyone can read by invite_token
CREATE POLICY "Members read own parties"
  ON parties FOR SELECT
  USING (id IN (SELECT get_member_party_ids()));

CREATE POLICY "Anyone can read party by invite token"
  ON parties FOR SELECT
  USING (true);  -- invite token lookup happens at app level

CREATE POLICY "Anyone can create a party"
  ON parties FOR INSERT
  WITH CHECK (true);

CREATE POLICY "DM can update party"
  ON parties FOR UPDATE
  USING (is_dm_of(id));

-- Members: party members can see each other
CREATE POLICY "Members read party members"
  ON members FOR SELECT
  USING (party_id IN (SELECT get_member_party_ids()));

CREATE POLICY "Anyone can join a party"
  ON members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members update own record"
  ON members FOR UPDATE
  USING (session_token = current_setting('request.headers', true)::json->>'x-session-token');

-- Quests: party members can read, DM can create/update
CREATE POLICY "Members read quests"
  ON quests FOR SELECT
  USING (party_id IN (SELECT get_member_party_ids()));

CREATE POLICY "DM creates quests"
  ON quests FOR INSERT
  WITH CHECK (is_dm_of(party_id));

CREATE POLICY "DM updates quests"
  ON quests FOR UPDATE
  USING (is_dm_of(party_id));

CREATE POLICY "DM deletes quests"
  ON quests FOR DELETE
  USING (is_dm_of(party_id));

-- Quest time slots: follow quest visibility
CREATE POLICY "Members read time slots"
  ON quest_time_slots FOR SELECT
  USING (quest_id IN (SELECT id FROM quests WHERE party_id IN (SELECT get_member_party_ids())));

CREATE POLICY "DM manages time slots"
  ON quest_time_slots FOR INSERT
  WITH CHECK (quest_id IN (SELECT id FROM quests WHERE is_dm_of(party_id)));

CREATE POLICY "DM deletes time slots"
  ON quest_time_slots FOR DELETE
  USING (quest_id IN (SELECT id FROM quests WHERE is_dm_of(party_id)));

-- Availability: members can read all, write own
CREATE POLICY "Members read availability"
  ON availability_responses FOR SELECT
  USING (quest_id IN (SELECT id FROM quests WHERE party_id IN (SELECT get_member_party_ids())));

CREATE POLICY "Members submit availability"
  ON availability_responses FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM members
      WHERE session_token = current_setting('request.headers', true)::json->>'x-session-token'
    )
  );

CREATE POLICY "Members update own availability"
  ON availability_responses FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE session_token = current_setting('request.headers', true)::json->>'x-session-token'
    )
  );

-- Chat: party members can read and send
CREATE POLICY "Members read chat"
  ON chat_messages FOR SELECT
  USING (party_id IN (SELECT get_member_party_ids()));

CREATE POLICY "Members send chat"
  ON chat_messages FOR INSERT
  WITH CHECK (
    party_id IN (SELECT get_member_party_ids())
    AND member_id IN (
      SELECT id FROM members
      WHERE session_token = current_setting('request.headers', true)::json->>'x-session-token'
    )
  );

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE availability_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE quests;
