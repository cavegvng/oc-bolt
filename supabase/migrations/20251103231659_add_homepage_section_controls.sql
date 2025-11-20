/*
  # Homepage Section Controls

  1. New Tables
    - `homepage_section_controls`
      - `id` (uuid, primary key) - Unique identifier
      - `section_key` (text, unique) - Internal key for the section (e.g., 'hero', 'stats', 'featured')
      - `section_name` (text) - Display name for the section (e.g., 'Hero Section', 'Stats Cards')
      - `description` (text, nullable) - Description of what the section displays
      - `is_visible` (boolean) - Whether the section should be displayed on the homepage
      - `display_order` (integer) - Order in which sections should appear (lower numbers first)
      - `config` (jsonb, nullable) - Additional configuration options for the section
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on `homepage_section_controls` table
    - Allow public read access (anyone can view section visibility)
    - Restrict write access to admins only (role = 'admin' or 'owner')

  3. Indexes
    - Index on section_key for fast lookups
    - Index on display_order for efficient sorting
    - Index on is_visible for filtering visible sections
*/

CREATE TABLE IF NOT EXISTS homepage_section_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  section_name text NOT NULL,
  description text,
  is_visible boolean DEFAULT true NOT NULL,
  display_order integer NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_key ON homepage_section_controls(section_key);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON homepage_section_controls(display_order);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_visible ON homepage_section_controls(is_visible) WHERE is_visible = true;

ALTER TABLE homepage_section_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view homepage section controls"
  ON homepage_section_controls
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can update homepage section controls"
  ON homepage_section_controls
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Only admins can insert homepage section controls"
  ON homepage_section_controls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Only admins can delete homepage section controls"
  ON homepage_section_controls
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner')
    )
  );