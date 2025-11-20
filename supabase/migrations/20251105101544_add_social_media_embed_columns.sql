/*
  # Add Social Media Embed Support to Discussions

  ## Summary
  This migration adds comprehensive social media link embedding capabilities to discussions,
  enabling automatic detection and embedding of Instagram, Twitter/X, and YouTube content
  with thumbnail extraction for beautiful card backgrounds.

  ## Changes Made

  ### 1. New Columns Added to `discussions` Table
  - `embeds` (JSONB array, nullable)
    - Stores array of extracted embed metadata from social media links
    - Each embed object contains: platform type, original URL, embed HTML/iframe code, thumbnail URL
    - Example: [{"platform": "youtube", "url": "...", "embed_html": "...", "thumbnail": "..."}]
  
  - `thumbnail_url` (text, nullable)
    - Stores the primary thumbnail URL extracted from social media links or custom image
    - Used as full-card background image on discussion cards
    - Prioritizes manual image_url over auto-detected thumbnails
  
  - `content_links` (JSONB array, nullable)
    - Stores parsed link metadata for tracking and display purposes
    - Tracks all detected social media URLs with platform identification
    - Example: [{"platform": "instagram", "url": "...", "detected_at": "..."}]

  ### 2. Default Values
  - All columns default to NULL to maintain backward compatibility
  - Existing discussions without embeds will continue to function normally
  - New discussions will populate these fields automatically during creation

  ### 3. Performance Considerations
  - JSONB format allows efficient querying and indexing
  - Nullable columns ensure minimal storage impact for discussions without social media content
  - GIN indexes can be added later if complex JSONB queries become common

  ## Security Notes
  - All embed HTML will be sanitized on the frontend before rendering
  - Thumbnail URLs will be validated before use as background images
  - Content Security Policy headers required for iframe embeds from trusted domains
*/

-- Add social media embed columns to discussions table
DO $$
BEGIN
  -- Add embeds column to store social media embed metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'embeds'
  ) THEN
    ALTER TABLE discussions ADD COLUMN embeds JSONB DEFAULT NULL;
  END IF;

  -- Add thumbnail_url column for card background images
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE discussions ADD COLUMN thumbnail_url TEXT DEFAULT NULL;
  END IF;

  -- Add content_links column for tracking detected social media links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'content_links'
  ) THEN
    ALTER TABLE discussions ADD COLUMN content_links JSONB DEFAULT NULL;
  END IF;
END $$;