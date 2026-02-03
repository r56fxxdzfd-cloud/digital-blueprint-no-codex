export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_entries: {
        Row: {
          action_done: boolean
          autopilot: string | null
          completed_at: string | null
          created_at: string
          critical_action: string | null
          date: string
          energy: number | null
          evidence: string | null
          id: string
          identity: string | null
          theme_id: string | null
          tomorrow_adjustment: string | null
          updated_at: string
          user_id: string | null
          visualization_id: string | null
        }
        Insert: {
          action_done?: boolean
          autopilot?: string | null
          completed_at?: string | null
          created_at?: string
          critical_action?: string | null
          date: string
          energy?: number | null
          evidence?: string | null
          id?: string
          identity?: string | null
          theme_id?: string | null
          tomorrow_adjustment?: string | null
          updated_at?: string
          user_id?: string | null
          visualization_id?: string | null
        }
        Update: {
          action_done?: boolean
          autopilot?: string | null
          completed_at?: string | null
          created_at?: string
          critical_action?: string | null
          date?: string
          energy?: number | null
          evidence?: string | null
          id?: string
          identity?: string | null
          theme_id?: string | null
          tomorrow_adjustment?: string | null
          updated_at?: string
          user_id?: string | null
          visualization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_entries_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_entries_visualization_id_fkey"
            columns: ["visualization_id"]
            isOneToOne: false
            referencedRelation: "visualizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quotes: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          language: string
          quote_id: string
          theme_id: string | null
        }
        Insert: {
          created_at?: string
          entry_date: string
          id?: string
          language?: string
          quote_id: string
          theme_id?: string | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          language?: string
          quote_id?: string
          theme_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_quotes_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_quotes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sessions: {
        Row: {
          action_category: string | null
          clarity_level: number | null
          created_at: string
          critical_action_completed: boolean | null
          daily_loss: string | null
          daily_win: string | null
          day_completed: boolean
          emotional_zone: string | null
          energy_delta: number | null
          entry_date: string
          evening_checkout_completed: boolean
          evening_completed: boolean
          evening_energy: number | null
          failure_reason: string | null
          id: string
          main_intention: string | null
          morning_action_completed: boolean
          morning_completed: boolean
          morning_energy: number | null
          morning_gratitude_category: string | null
          morning_gratitude_text: string | null
          morning_journal_completed: boolean
          morning_meditation_completed: boolean
          morning_meditation_duration: number | null
          morning_visualization_id: string | null
          night_gratitude_text: string | null
          obstacle: string | null
          presence_score: number | null
          quote_absorbed: boolean | null
          quote_id: string | null
          rule_for_tomorrow: string | null
          theme_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_category?: string | null
          clarity_level?: number | null
          created_at?: string
          critical_action_completed?: boolean | null
          daily_loss?: string | null
          daily_win?: string | null
          day_completed?: boolean
          emotional_zone?: string | null
          energy_delta?: number | null
          entry_date: string
          evening_checkout_completed?: boolean
          evening_completed?: boolean
          evening_energy?: number | null
          failure_reason?: string | null
          id?: string
          main_intention?: string | null
          morning_action_completed?: boolean
          morning_completed?: boolean
          morning_energy?: number | null
          morning_gratitude_category?: string | null
          morning_gratitude_text?: string | null
          morning_journal_completed?: boolean
          morning_meditation_completed?: boolean
          morning_meditation_duration?: number | null
          morning_visualization_id?: string | null
          night_gratitude_text?: string | null
          obstacle?: string | null
          presence_score?: number | null
          quote_absorbed?: boolean | null
          quote_id?: string | null
          rule_for_tomorrow?: string | null
          theme_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_category?: string | null
          clarity_level?: number | null
          created_at?: string
          critical_action_completed?: boolean | null
          daily_loss?: string | null
          daily_win?: string | null
          day_completed?: boolean
          emotional_zone?: string | null
          energy_delta?: number | null
          entry_date?: string
          evening_checkout_completed?: boolean
          evening_completed?: boolean
          evening_energy?: number | null
          failure_reason?: string | null
          id?: string
          main_intention?: string | null
          morning_action_completed?: boolean
          morning_completed?: boolean
          morning_energy?: number | null
          morning_gratitude_category?: string | null
          morning_gratitude_text?: string | null
          morning_journal_completed?: boolean
          morning_meditation_completed?: boolean
          morning_meditation_duration?: number | null
          morning_visualization_id?: string | null
          night_gratitude_text?: string | null
          obstacle?: string | null
          presence_score?: number | null
          quote_absorbed?: boolean | null
          quote_id?: string | null
          rule_for_tomorrow?: string | null
          theme_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          action: string | null
          created_at: string
          emotion: string | null
          emotion_other: string | null
          entry_date: string
          free_note: string | null
          gratitude: string | null
          id: string
          insight: string | null
          mood: string | null
          mood_other: string | null
          tags: string[] | null
          theme_id: string | null
          updated_at: string
          user_id: string | null
          visualization_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          emotion?: string | null
          emotion_other?: string | null
          entry_date: string
          free_note?: string | null
          gratitude?: string | null
          id?: string
          insight?: string | null
          mood?: string | null
          mood_other?: string | null
          tags?: string[] | null
          theme_id?: string | null
          updated_at?: string
          user_id?: string | null
          visualization_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          emotion?: string | null
          emotion_other?: string | null
          entry_date?: string
          free_note?: string | null
          gratitude?: string | null
          id?: string
          insight?: string | null
          mood?: string | null
          mood_other?: string | null
          tags?: string[] | null
          theme_id?: string | null
          updated_at?: string
          user_id?: string | null
          visualization_id?: string | null
        }
        Relationships: []
      }
      notification_delivery_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          enabled: boolean
          evening_enabled: boolean
          evening_time: string
          id: string
          message_evening: string
          message_midday: string
          message_morning: string
          midday_enabled: boolean
          midday_time: string
          morning_enabled: boolean
          morning_time: string
          timezone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          evening_enabled?: boolean
          evening_time?: string
          id?: string
          message_evening?: string
          message_midday?: string
          message_morning?: string
          midday_enabled?: boolean
          midday_time?: string
          morning_enabled?: boolean
          morning_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          evening_enabled?: boolean
          evening_time?: string
          id?: string
          message_evening?: string
          message_midday?: string
          message_morning?: string
          midday_enabled?: boolean
          midday_time?: string
          morning_enabled?: boolean
          morning_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          author: string | null
          created_at: string
          id: string
          is_active: boolean
          language: string
          quote_text: string
          source: string | null
          source_type: string
          theme_id: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          quote_text: string
          source?: string | null
          source_type?: string
          theme_id?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          quote_text?: string
          source?: string | null
          source_type?: string
          theme_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          default_theme_mode: string
          id: string
          no_repeat_days: number
          preferred_duration_min: number
          theme_lookback_days: number
          tts_breath_pause_ms: number
          tts_enabled: boolean
          tts_end_silence_ms: number
          tts_fill_mode: string
          tts_max_chunk_chars: number
          tts_microchunk_max_words: number
          tts_microchunk_min_words: number
          tts_outro_enabled: boolean
          tts_outro_text: string
          tts_paragraph_pause_ms: number
          tts_pause_base_ms: number
          tts_pause_ms_comma: number
          tts_pause_ms_ellipsis: number
          tts_pause_multiplier: number
          tts_pause_paragraph_extra_ms: number
          tts_pause_per_word_ms: number
          tts_pause_sentence_extra_ms: number
          tts_pitch: number
          tts_prefer_female: boolean
          tts_rate: number
          tts_sentence_pause_ms: number
          tts_target_max_ms: number
          tts_target_min_ms: number
          tts_target_total_ms: number
          tts_voice_uri: string | null
          tts_volume: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_theme_mode?: string
          id?: string
          no_repeat_days?: number
          preferred_duration_min?: number
          theme_lookback_days?: number
          tts_breath_pause_ms?: number
          tts_enabled?: boolean
          tts_end_silence_ms?: number
          tts_fill_mode?: string
          tts_max_chunk_chars?: number
          tts_microchunk_max_words?: number
          tts_microchunk_min_words?: number
          tts_outro_enabled?: boolean
          tts_outro_text?: string
          tts_paragraph_pause_ms?: number
          tts_pause_base_ms?: number
          tts_pause_ms_comma?: number
          tts_pause_ms_ellipsis?: number
          tts_pause_multiplier?: number
          tts_pause_paragraph_extra_ms?: number
          tts_pause_per_word_ms?: number
          tts_pause_sentence_extra_ms?: number
          tts_pitch?: number
          tts_prefer_female?: boolean
          tts_rate?: number
          tts_sentence_pause_ms?: number
          tts_target_max_ms?: number
          tts_target_min_ms?: number
          tts_target_total_ms?: number
          tts_voice_uri?: string | null
          tts_volume?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_theme_mode?: string
          id?: string
          no_repeat_days?: number
          preferred_duration_min?: number
          theme_lookback_days?: number
          tts_breath_pause_ms?: number
          tts_enabled?: boolean
          tts_end_silence_ms?: number
          tts_fill_mode?: string
          tts_max_chunk_chars?: number
          tts_microchunk_max_words?: number
          tts_microchunk_min_words?: number
          tts_outro_enabled?: boolean
          tts_outro_text?: string
          tts_paragraph_pause_ms?: number
          tts_pause_base_ms?: number
          tts_pause_ms_comma?: number
          tts_pause_ms_ellipsis?: number
          tts_pause_multiplier?: number
          tts_pause_paragraph_extra_ms?: number
          tts_pause_per_word_ms?: number
          tts_pause_sentence_extra_ms?: number
          tts_pitch?: number
          tts_prefer_female?: boolean
          tts_rate?: number
          tts_sentence_pause_ms?: number
          tts_target_max_ms?: number
          tts_target_min_ms?: number
          tts_target_total_ms?: number
          tts_voice_uri?: string | null
          tts_volume?: number
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      visualizations: {
        Row: {
          created_at: string
          duration_min: number
          energy_max: number
          energy_min: number
          id: string
          is_active: boolean
          last_used_at: string | null
          script: string
          tags: string[] | null
          theme_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          energy_max?: number
          energy_min?: number
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          script: string
          tags?: string[] | null
          theme_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          energy_max?: number
          energy_min?: number
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          script?: string
          tags?: string[] | null
          theme_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visualizations_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          bottleneck_habit: string | null
          created_at: string
          hard_truth: string | null
          id: string
          next_week_goal: string | null
          next_week_identity: string | null
          one_action: string | null
          score_0_10: number | null
          self_deception_pattern: string | null
          stop_rule: string | null
          strategy_continue: string | null
          strategy_start: string | null
          strategy_stop: string | null
          theme_id: string | null
          updated_at: string
          user_id: string | null
          week_start_date: string
          wins: string | null
        }
        Insert: {
          bottleneck_habit?: string | null
          created_at?: string
          hard_truth?: string | null
          id?: string
          next_week_goal?: string | null
          next_week_identity?: string | null
          one_action?: string | null
          score_0_10?: number | null
          self_deception_pattern?: string | null
          stop_rule?: string | null
          strategy_continue?: string | null
          strategy_start?: string | null
          strategy_stop?: string | null
          theme_id?: string | null
          updated_at?: string
          user_id?: string | null
          week_start_date: string
          wins?: string | null
        }
        Update: {
          bottleneck_habit?: string | null
          created_at?: string
          hard_truth?: string | null
          id?: string
          next_week_goal?: string | null
          next_week_identity?: string | null
          one_action?: string | null
          score_0_10?: number | null
          self_deception_pattern?: string | null
          stop_rule?: string | null
          strategy_continue?: string | null
          strategy_start?: string | null
          strategy_stop?: string | null
          theme_id?: string | null
          updated_at?: string
          user_id?: string | null
          week_start_date?: string
          wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
