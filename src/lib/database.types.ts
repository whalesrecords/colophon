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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      book_metadata: {
        Row: {
          authors: string[] | null
          cover_url: string | null
          description: string | null
          fetched_at: string
          genres: string[] | null
          isbn13: string
          language: string | null
          page_count: number | null
          published_date: string | null
          publisher: string | null
          raw: Json | null
          source: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          authors?: string[] | null
          cover_url?: string | null
          description?: string | null
          fetched_at?: string
          genres?: string[] | null
          isbn13: string
          language?: string | null
          page_count?: number | null
          published_date?: string | null
          publisher?: string | null
          raw?: Json | null
          source?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          authors?: string[] | null
          cover_url?: string | null
          description?: string | null
          fetched_at?: string
          genres?: string[] | null
          isbn13?: string
          language?: string | null
          page_count?: number | null
          published_date?: string | null
          publisher?: string | null
          raw?: Json | null
          source?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      circle_book_comments: {
        Row: {
          body: string
          circle_id: string
          created_at: string
          id: string
          isbn13: string
          user_id: string
        }
        Insert: {
          body: string
          circle_id: string
          created_at?: string
          id?: string
          isbn13: string
          user_id: string
        }
        Update: {
          body?: string
          circle_id?: string
          created_at?: string
          id?: string
          isbn13?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_books: {
        Row: {
          added_at: string
          circle_id: string
          finished_on: string | null
          isbn13: string
          rating: number | null
          reading_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          circle_id: string
          finished_on?: string | null
          isbn13: string
          rating?: number | null
          reading_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          circle_id?: string
          finished_on?: string | null
          isbn13?: string
          rating?: number | null
          reading_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_events: {
        Row: {
          circle_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      circle_members: {
        Row: {
          circle_id: string
          display_name: string | null
          joined_at: string
          user_id: string
        }
        Insert: {
          circle_id: string
          display_name?: string | null
          joined_at?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          display_name?: string | null
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_proposal_votes: {
        Row: {
          circle_id: string
          created_at: string
          proposal_id: string
          user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          proposal_id: string
          user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          proposal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_proposal_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "circle_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_proposals: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          isbn13: string
          note: string | null
          proposed_by: string
          status: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          isbn13: string
          note?: string | null
          proposed_by: string
          status?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          isbn13?: string
          note?: string | null
          proposed_by?: string
          status?: string
        }
        Relationships: []
      }
      circles: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      item_shelves: {
        Row: {
          item_id: string
          shelf_id: string
        }
        Insert: {
          item_id: string
          shelf_id: string
        }
        Update: {
          item_id?: string
          shelf_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_shelves_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_shelves_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelves"
            referencedColumns: ["id"]
          },
        ]
      }
      item_tags: {
        Row: {
          item_id: string
          tag_id: string
        }
        Insert: {
          item_id: string
          tag_id: string
        }
        Update: {
          item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          added_at: string
          borrowed_from: string | null
          condition: string | null
          cover_override: string | null
          format: string | null
          id: string
          isbn13: string
          location: string | null
          notes: string | null
          ownership: string
          purchase_date: string | null
          purchase_price: number | null
          purchase_store: string | null
          rating: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          borrowed_from?: string | null
          condition?: string | null
          cover_override?: string | null
          format?: string | null
          id?: string
          isbn13: string
          location?: string | null
          notes?: string | null
          ownership?: string
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_store?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          borrowed_from?: string | null
          condition?: string | null
          cover_override?: string | null
          format?: string | null
          id?: string
          isbn13?: string
          location?: string | null
          notes?: string | null
          ownership?: string
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_store?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_isbn13_fkey"
            columns: ["isbn13"]
            isOneToOne: false
            referencedRelation: "book_metadata"
            referencedColumns: ["isbn13"]
          },
        ]
      }
      loans: {
        Row: {
          borrower: string
          created_at: string
          due_on: string | null
          id: string
          item_id: string
          lent_on: string
          notes: string | null
          returned_on: string | null
        }
        Insert: {
          borrower: string
          created_at?: string
          due_on?: string | null
          id?: string
          item_id: string
          lent_on?: string
          notes?: string | null
          returned_on?: string | null
        }
        Update: {
          borrower?: string
          created_at?: string
          due_on?: string | null
          id?: string
          item_id?: string
          lent_on?: string
          notes?: string | null
          returned_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_series_totals: {
        Row: {
          normalized_key: string
          total_volumes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          normalized_key: string
          total_volumes?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          normalized_key?: string
          total_volumes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          name: string
          normalized_key: string
          source: string | null
          total_volumes: number | null
          updated_at: string
        }
        Insert: {
          name: string
          normalized_key: string
          source?: string | null
          total_volumes?: number | null
          updated_at?: string
        }
        Update: {
          name?: string
          normalized_key?: string
          source?: string | null
          total_volumes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          circle_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          circle_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          circle_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          message_id: string | null
          reason: string | null
          reported_user_id: string | null
          reporter_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string | null
          reported_user_id?: string | null
          reporter_id?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string | null
          reported_user_id?: string | null
          reporter_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id?: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          annual_goal: number | null
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          pseudo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_goal?: number | null
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          pseudo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_goal?: number | null
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          pseudo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          created_at: string
          current_page: number | null
          finished_on: string | null
          id: string
          item_id: string
          reader: string | null
          started_on: string | null
          status: string | null
          total_pages: number | null
        }
        Insert: {
          created_at?: string
          current_page?: number | null
          finished_on?: string | null
          id?: string
          item_id: string
          reader?: string | null
          started_on?: string | null
          status?: string | null
          total_pages?: number | null
        }
        Update: {
          created_at?: string
          current_page?: number | null
          finished_on?: string | null
          id?: string
          item_id?: string
          reader?: string | null
          started_on?: string | null
          status?: string | null
          total_pages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      shares: {
        Row: {
          created_at: string
          id: string
          scope: string
          shelf_id: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scope: string
          shelf_id?: string | null
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scope?: string
          shelf_id?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shares_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelves"
            referencedColumns: ["id"]
          },
        ]
      }
      shelves: {
        Row: {
          id: string
          name: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      community_trends: { Args: Record<PropertyKey, never>; Returns: Json }
      create_circle: {
        Args: { p_name: string }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
        }
      }
      is_circle_member: {
        Args: { c_id: string; u_id: string }
        Returns: boolean
      }
      is_circle_owner: {
        Args: { c_id: string; u_id: string }
        Returns: boolean
      }
      join_circle: {
        Args: { p_code: string }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
        }
      }
      toggle_proposal_vote: {
        Args: { p_proposal_id: string }
        Returns: boolean
      }
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
