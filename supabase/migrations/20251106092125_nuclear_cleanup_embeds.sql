/*
  # Nuclear Cleanup: Remove Embed Bloat

  1. Changes
    - Drop `embeds` column (stored HTML bloat)
    - Drop `content_links` column (redundant metadata)
    - Add `twitter_url` column (raw URL only)
    - Add `instagram_url` column (raw URL only)
    - Add `youtube_url` column (raw URL only)
  
  2. Strategy
    - Platforms handle their own embeds
    - Zero oEmbed API calls
    - Zero stored HTML
    - 18-line universal component
*/

ALTER TABLE discussions 
DROP COLUMN IF EXISTS embeds,
DROP COLUMN IF EXISTS content_links;

ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT;
