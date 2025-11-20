/*
  # Retroactive URL Extraction

  1. Changes
    - Extract Twitter/X URLs from existing discussion descriptions
    - Extract Instagram URLs from existing discussion descriptions
    - Extract YouTube URLs from existing discussion descriptions
  
  2. Notes
    - Processes all existing discussions
    - Stores only raw URLs, no HTML or metadata
*/

UPDATE discussions 
SET 
  twitter_url = (
    SELECT substring(description FROM 'https?://(x\.com|twitter\.com)/[^\s"]+')
    WHERE description ~ 'x\.com|twitter\.com'
  ),
  instagram_url = (
    SELECT substring(description FROM 'https?://(www\.)?instagram\.com/[^\s"]+')
    WHERE description ~ 'instagram\.com'
  ),
  youtube_url = (
    SELECT substring(description FROM 'https?://(www\.)?(youtube\.com|youtu\.be)/[^\s"]+')
    WHERE description ~ 'youtube\.com|youtu\.be'
  )
WHERE description ~ 'x\.com|twitter\.com|instagram\.com|youtube\.com|youtu\.be';
