/*
  # Seed Homepage Section Controls

  1. Initial Data
    Seeds the homepage_section_controls table with all current homepage sections from HomePage.tsx:
    - Hero Section - Main welcome banner with site title and CTA buttons
    - Stats Cards - Three stat cards showing total discussions, users, and comments
    - Featured Discussions - Grid of up to 3 featured discussions
    - Trending Now - List of 5 discussions with highest view counts
    - Discover Discussions - Masonry grid of all recent discussions with special sizing for featured/promoted
    - Explore Topics - Grid of category cards with icons

  2. Notes
    - All sections are visible by default
    - Display order matches current homepage layout
    - Config field is empty but available for future customization options
*/

INSERT INTO homepage_section_controls (section_key, section_name, description, is_visible, display_order, config)
VALUES
  (
    'hero',
    'Hero Section',
    'Main welcome banner with site title, tagline, and call-to-action buttons (Browse Discussions, Hot Topics)',
    true,
    1,
    '{}'::jsonb
  ),
  (
    'stats',
    'Stats Cards',
    'Three metric cards displaying total discussions, community members, and comments posted',
    true,
    2,
    '{}'::jsonb
  ),
  (
    'featured',
    'Featured Discussions',
    'Grid showcase of up to 3 discussions marked as featured by moderators',
    true,
    3,
    '{}'::jsonb
  ),
  (
    'trending',
    'Trending Now',
    'List of 5 discussions with the highest view counts, showing what is currently popular',
    true,
    4,
    '{}'::jsonb
  ),
  (
    'discover',
    'Discover Discussions',
    'Masonry grid of recent discussions with special sizing for featured and promoted posts',
    true,
    5,
    '{}'::jsonb
  ),
  (
    'categories',
    'Explore Topics',
    'Grid of all discussion categories with colored icons, allowing users to browse by topic',
    true,
    6,
    '{}'::jsonb
  )
ON CONFLICT (section_key) DO NOTHING;