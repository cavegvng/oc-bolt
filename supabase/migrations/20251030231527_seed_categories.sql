/*
  # Seed Categories Data

  ## Purpose
  Populates the categories table with initial debate topics.

  ## Categories
  1. **Political** - Government, policy, elections, political systems
  2. **Social** - Society, culture, relationships, social issues
  3. **Legal** - Law, justice, rights, legal frameworks
  4. **Cultural** - Arts, traditions, identity, cultural practices
  5. **Economic** - Finance, business, markets, economic policy
  6. **Environmental** - Climate, sustainability, nature, conservation

  ## Details
  Each category has:
  - Unique name and URL-friendly slug
  - Color code for UI theming
  - Lucide React icon name for visual identification
  - Brief description of scope
*/

-- Insert categories with proper error handling
INSERT INTO categories (name, slug, color, icon, description)
VALUES
  (
    'Political',
    'political',
    '#EF4444',
    'Vote',
    'Discuss government policies, elections, political systems, and civic matters'
  ),
  (
    'Social',
    'social',
    '#3B82F6',
    'Users',
    'Explore societal issues, relationships, community dynamics, and social change'
  ),
  (
    'Legal',
    'legal',
    '#8B5CF6',
    'Scale',
    'Debate laws, justice systems, rights, regulations, and legal frameworks'
  ),
  (
    'Cultural',
    'cultural',
    '#EC4899',
    'Palette',
    'Examine arts, traditions, identity, cultural practices, and heritage'
  ),
  (
    'Economic',
    'economic',
    '#10B981',
    'TrendingUp',
    'Analyze markets, business, finance, economic policies, and fiscal matters'
  ),
  (
    'Environmental',
    'environmental',
    '#14B8A6',
    'Leaf',
    'Address climate change, sustainability, conservation, and environmental protection'
  )
ON CONFLICT (slug) DO NOTHING;
