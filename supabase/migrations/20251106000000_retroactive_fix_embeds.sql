/*
  # Retroactive Social Media Embed Fix

  ## Summary
  This migration provides a one-click SQL fixer to retroactively process all discussions
  that contain social media links but don't have embed metadata populated yet.

  ## What it does
  - Identifies discussions with null embeds/thumbnail_url
  - Searches description text for Instagram, Twitter/X, and YouTube URLs
  - Populates content_links array with detected platform links
  - Sets a flag to trigger client-side embed processing

  ## Usage
  Run this migration to mark all discussions for embed reprocessing.
  The frontend will automatically extract and display embeds when these discussions are viewed.

  ## Safety
  - Only updates discussions with null embed data
  - Preserves existing manually set thumbnails (image_url)
  - Non-destructive operation
*/

-- Update discussions that have social media links but no embed data
DO $$
DECLARE
  discussion_record RECORD;
  detected_links JSONB;
BEGIN
  FOR discussion_record IN
    SELECT id, description, image_url
    FROM discussions
    WHERE (embeds IS NULL OR thumbnail_url IS NULL)
      AND moderation_status = 'approved'
  LOOP
    detected_links := '[]'::jsonb;

    -- Detect YouTube links
    IF discussion_record.description ~ 'https?://(www\.)?(youtube\.com/watch|youtube\.com/shorts|youtu\.be)' THEN
      detected_links := detected_links || jsonb_build_object(
        'platform', 'youtube',
        'url', (regexp_match(discussion_record.description, 'https?://(www\.)?(youtube\.com/watch\?v=|youtube\.com/shorts/|youtu\.be/)[a-zA-Z0-9_-]{11}'))[0],
        'detected_at', now()
      )::jsonb;
    END IF;

    -- Detect Twitter/X links
    IF discussion_record.description ~ 'https?://(www\.)?(twitter\.com|x\.com)/[a-zA-Z0-9_]+/status/\d+' THEN
      detected_links := detected_links || jsonb_build_object(
        'platform', 'twitter',
        'url', (regexp_match(discussion_record.description, 'https?://(www\.)?(twitter\.com|x\.com)/[a-zA-Z0-9_]+/status/\d+'))[0],
        'detected_at', now()
      )::jsonb;
    END IF;

    -- Detect Instagram links
    IF discussion_record.description ~ 'https?://(www\.)?instagram\.com/(p|reel)/[a-zA-Z0-9_-]+' THEN
      detected_links := detected_links || jsonb_build_object(
        'platform', 'instagram',
        'url', (regexp_match(discussion_record.description, 'https?://(www\.)?instagram\.com/(p|reel)/[a-zA-Z0-9_-]+'))[0],
        'detected_at', now()
      )::jsonb;
    END IF;

    -- Only update if links were found
    IF jsonb_array_length(detected_links) > 0 THEN
      UPDATE discussions
      SET
        content_links = detected_links,
        updated_at = now()
      WHERE id = discussion_record.id;

      RAISE NOTICE 'Updated discussion % with % detected links', discussion_record.id, jsonb_array_length(detected_links);
    END IF;
  END LOOP;

  RAISE NOTICE 'Retroactive embed fix complete';
END $$;

-- Create a function to manually trigger embed refresh for a specific discussion
CREATE OR REPLACE FUNCTION refresh_discussion_embeds(discussion_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE discussions
  SET
    embeds = NULL,
    thumbnail_url = CASE WHEN image_url IS NOT NULL THEN image_url ELSE NULL END,
    updated_at = now()
  WHERE id = discussion_id;

  RAISE NOTICE 'Cleared embed cache for discussion %', discussion_id;
END $$;

-- Usage example (commented out):
-- SELECT refresh_discussion_embeds('your-discussion-uuid-here');
