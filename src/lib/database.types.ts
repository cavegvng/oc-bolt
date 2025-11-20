export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          bio: string | null
          reputation_points: number
          role: 'owner' | 'admin' | 'super_moderator' | 'moderator' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          reputation_points?: number
          role?: 'owner' | 'admin' | 'super_moderator' | 'moderator' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          reputation_points?: number
          role?: 'owner' | 'admin' | 'super_moderator' | 'moderator' | 'user'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          icon: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color: string
          icon: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          icon?: string
          description?: string | null
          created_at?: string
        }
      }
      discussions: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string
          category_id: string | null
          category_ids: string[] | null
          image_url: string | null
          video_url: string | null
          thumbnail_url: string | null
          twitter_url: string | null
          instagram_url: string | null
          youtube_url: string | null
          is_pinned: boolean
          is_featured: boolean
          is_promoted: boolean
          promoted_start_date: string | null
          promoted_end_date: string | null
          promoted_by: string | null
          featured_at: string | null
          featured_by: string | null
          view_count: number
          moderation_status: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count: number
          last_moderation_action: string | null
          moderated_by: string | null
          last_activity_at: string
          last_activity_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description: string
          category_id?: string | null
          category_ids?: string[] | null
          image_url?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          is_pinned?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          promoted_start_date?: string | null
          promoted_end_date?: string | null
          promoted_by?: string | null
          featured_at?: string | null
          featured_by?: string | null
          view_count?: number
          moderation_status?: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count?: number
          last_moderation_action?: string | null
          moderated_by?: string | null
          last_activity_at?: string
          last_activity_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          description?: string
          category_id?: string | null
          category_ids?: string[] | null
          image_url?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          is_pinned?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          promoted_start_date?: string | null
          promoted_end_date?: string | null
          promoted_by?: string | null
          featured_at?: string | null
          featured_by?: string | null
          view_count?: number
          moderation_status?: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count?: number
          last_moderation_action?: string | null
          moderated_by?: string | null
          last_activity_at?: string
          last_activity_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          discussion_id: string
          vote_type: 'pro' | 'con' | 'neutral'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          discussion_id: string
          vote_type: 'pro' | 'con' | 'neutral'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          discussion_id?: string
          vote_type?: 'pro' | 'con' | 'neutral'
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          discussion_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          upvotes: number
          downvotes: number
          moderation_status: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count: number
          last_moderation_action: string | null
          moderated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          upvotes?: number
          downvotes?: number
          moderation_status?: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count?: number
          last_moderation_action?: string | null
          moderated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          upvotes?: number
          downvotes?: number
          moderation_status?: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count?: number
          last_moderation_action?: string | null
          moderated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comment_votes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          vote_value: -1 | 1
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          vote_value: -1 | 1
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          vote_value?: -1 | 1
          created_at?: string
        }
      }
      hot_topics: {
        Row: {
          id: string
          discussion_id: string
          trending_score: number
          comment_velocity: number
          temperature: number
          updated_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          trending_score?: number
          comment_velocity?: number
          temperature?: number
          updated_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          trending_score?: number
          comment_velocity?: number
          temperature?: number
          updated_at?: string
        }
      }
      activity_feed: {
        Row: {
          id: string
          user_id: string
          action_type: 'created_discussion' | 'posted_comment' | 'voted'
          discussion_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: 'created_discussion' | 'posted_comment' | 'voted'
          discussion_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: 'created_discussion' | 'posted_comment' | 'voted'
          discussion_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          badge_name: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          badge_name: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          badge_name?: string
          earned_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          user_id: string
          platform: 'instagram' | 'x' | 'tiktok' | 'youtube'
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: 'instagram' | 'x' | 'tiktok' | 'youtube'
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: 'instagram' | 'x' | 'tiktok' | 'youtube'
          url?: string
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          custom_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          custom_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          custom_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debates: {
        Row: {
          id: string
          author_id: string
          topic: string
          description: string | null
          category_id: string | null
          is_locked: boolean
          is_featured: boolean
          view_count: number
          moderation_status: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count: number
          last_moderation_action: string | null
          moderated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          topic: string
          description?: string | null
          category_id?: string | null
          is_locked?: boolean
          is_featured?: boolean
          view_count?: number
          moderation_status?: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count?: number
          last_moderation_action?: string | null
          moderated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          topic?: string
          description?: string | null
          category_id?: string | null
          is_locked?: boolean
          is_featured?: boolean
          view_count?: number
          moderation_status?: 'approved' | 'pending' | 'quarantined' | 'removed'
          report_count?: number
          last_moderation_action?: string | null
          moderated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profile_visitors: {
        Row: {
          id: string
          profile_id: string
          visitor_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          visitor_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          visitor_id?: string
          viewed_at?: string
        }
      }
      achievements_definitions: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          criteria: Json
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          criteria: Json
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          criteria?: Json
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string | null
          progress: number
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string | null
          progress?: number
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string | null
          progress?: number
        }
      }
      debate_stances: {
        Row: {
          id: string
          debate_id: string
          user_id: string
          stance: 'pro' | 'con' | 'neutral'
          argument: string
          vote_change_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          debate_id: string
          user_id: string
          stance: 'pro' | 'con' | 'neutral'
          argument: string
          vote_change_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          debate_id?: string
          user_id?: string
          stance?: 'pro' | 'con' | 'neutral'
          argument?: string
          vote_change_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      stance_votes: {
        Row: {
          id: string
          stance_id: string
          user_id: string
          vote_value: -1 | 1
          created_at: string
        }
        Insert: {
          id?: string
          stance_id: string
          user_id: string
          vote_value: -1 | 1
          created_at?: string
        }
        Update: {
          id?: string
          stance_id?: string
          user_id?: string
          vote_value?: -1 | 1
          created_at?: string
        }
      }
      vote_trends: {
        Row: {
          id: string
          debate_id: string
          timestamp: string
          pro_count: number
          con_count: number
          neutral_count: number
          created_at: string
        }
        Insert: {
          id?: string
          debate_id: string
          timestamp?: string
          pro_count?: number
          con_count?: number
          neutral_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          debate_id?: string
          timestamp?: string
          pro_count?: number
          con_count?: number
          neutral_count?: number
          created_at?: string
        }
      }
      discussion_likes: {
        Row: {
          id: string
          user_id: string
          discussion_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          discussion_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          discussion_id?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          content_type: 'discussion' | 'comment' | 'debate'
          content_id: string
          reason: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'off_topic' | 'other'
          description: string | null
          status: 'unresolved' | 'in_progress' | 'resolved' | 'dismissed'
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          content_type: 'discussion' | 'comment' | 'debate'
          content_id: string
          reason: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'off_topic' | 'other'
          description?: string | null
          status?: 'unresolved' | 'in_progress' | 'resolved' | 'dismissed'
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          content_type?: 'discussion' | 'comment' | 'debate'
          content_id?: string
          reason?: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'off_topic' | 'other'
          description?: string | null
          status?: 'unresolved' | 'in_progress' | 'resolved' | 'dismissed'
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
      content_restrictions: {
        Row: {
          id: string
          content_type: 'discussion' | 'comment' | 'debate'
          content_id: string
          restriction_type: 'quarantined' | 'removed' | 'restored'
          moderator_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content_type: 'discussion' | 'comment' | 'debate'
          content_id: string
          restriction_type: 'quarantined' | 'removed' | 'restored'
          moderator_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content_type?: 'discussion' | 'comment' | 'debate'
          content_id?: string
          restriction_type?: 'quarantined' | 'removed' | 'restored'
          moderator_id?: string
          reason?: string | null
          created_at?: string
        }
      }
      discussion_control_audit_log: {
        Row: {
          id: string
          discussion_id: string
          user_id: string | null
          action_type: 'featured' | 'unfeatured' | 'promoted' | 'unpromoted' | 'pinned' | 'unpinned' | 'promotion_expired'
          field_changed: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id?: string | null
          action_type: 'featured' | 'unfeatured' | 'promoted' | 'unpromoted' | 'pinned' | 'unpinned' | 'promotion_expired'
          field_changed: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string | null
          action_type?: 'featured' | 'unfeatured' | 'promoted' | 'unpromoted' | 'pinned' | 'unpinned' | 'promotion_expired'
          field_changed?: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
      }
      homepage_section_controls: {
        Row: {
          id: string
          section_key: string
          section_name: string
          description: string | null
          is_visible: boolean
          display_order: number
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_key: string
          section_name: string
          description?: string | null
          is_visible?: boolean
          display_order: number
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section_key?: string
          section_name?: string
          description?: string | null
          is_visible?: boolean
          display_order?: number
          config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      homepage_control_audit_log: {
        Row: {
          id: string
          section_id: string
          user_id: string | null
          action_type: string
          field_changed: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          user_id?: string | null
          action_type: string
          field_changed: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          user_id?: string | null
          action_type?: string
          field_changed?: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string
          link_url: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content: string
          link_url?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string
          link_url?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
