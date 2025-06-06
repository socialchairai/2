export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          chapter_id: string
          created_at: string | null
          created_by: string
          id: string
          period: Database["public"]["Enums"]["budget_period"]
          period_label: string
          total_budget: number
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          created_by: string
          id?: string
          period: Database["public"]["Enums"]["budget_period"]
          period_label: string
          total_budget: number
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          period?: Database["public"]["Enums"]["budget_period"]
          period_label?: string
          total_budget?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_invites: {
        Row: {
          chapter_id: string
          created_at: string | null
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          role: Database["public"]["Enums"]["invite_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          invited_by: string
          invited_email: string
          role?: Database["public"]["Enums"]["invite_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          role?: Database["public"]["Enums"]["invite_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_invites_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_join_requests: {
        Row: {
          chapter_id: string
          created_at: string | null
          id: string
          reason: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["join_request_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["join_request_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["join_request_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_join_requests_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_join_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_code: string
          created_at: string | null
          founded_date: string | null
          fraternity_name: string
          id: string
          is_active: boolean | null
          location: string | null
          school_name: string
          updated_at: string | null
        }
        Insert: {
          chapter_code: string
          created_at?: string | null
          founded_date?: string | null
          fraternity_name: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          school_name: string
          updated_at?: string | null
        }
        Update: {
          chapter_code?: string
          created_at?: string | null
          founded_date?: string | null
          fraternity_name?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          school_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_checklists: {
        Row: {
          completed: boolean | null
          created_at: string | null
          event_id: string
          id: string
          item: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          item: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          item?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          created_at: string | null
          due_date: string | null
          event_id: string
          id: string
          notes: string | null
          priority: string | null
          title: string
          type: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          notes?: string | null
          priority?: string | null
          title: string
          type?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          priority?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          budget_estimate: number | null
          chapter_id: string
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          type: string | null
          updated_at: string | null
          venue: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          budget_estimate?: number | null
          chapter_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          type?: string | null
          updated_at?: string | null
          venue?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          budget_estimate?: number | null
          chapter_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          type?: string | null
          updated_at?: string | null
          venue?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          budget_id: string
          category: Database["public"]["Enums"]["expense_category"]
          chapter_id: string
          created_at: string | null
          date_incurred: string
          description: string | null
          id: string
          receipt_url: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          title: string
        }
        Insert: {
          amount: number
          budget_id: string
          category: Database["public"]["Enums"]["expense_category"]
          chapter_id: string
          created_at?: string | null
          date_incurred: string
          description?: string | null
          id?: string
          receipt_url?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          title: string
        }
        Update: {
          amount?: number
          budget_id?: string
          category?: Database["public"]["Enums"]["expense_category"]
          chapter_id?: string
          created_at?: string | null
          date_incurred?: string
          description?: string | null
          id?: string
          receipt_url?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      new_chapters: {
        Row: {
          created_at: string | null
          founded_date: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          university_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          founded_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          university_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          founded_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          university_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_chapters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_chapters_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_event_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_event_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_event_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sponsorships: {
        Row: {
          amount: number
          chapter_id: string
          contact_email: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          sponsor_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          chapter_id: string
          contact_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          sponsor_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          chapter_id?: string
          contact_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          sponsor_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      university_organizations: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          university_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          university_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_organizations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_chapter_links: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          joined_at: string | null
          left_at: string | null
          role_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_chapter_links_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_chapter_links_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_chapter_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_login: string | null
          last_name: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          tier: Database["public"]["Enums"]["user_tier"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_login?: string | null
          last_name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_login?: string | null
          last_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      budget_period: "monthly" | "semester"
      event_status: "planned" | "active" | "cancelled" | "completed"
      event_visibility: "public" | "chapter-only" | "officers-only"
      expense_category: "alcohol" | "venue" | "decor" | "security" | "misc"
      expense_status: "pending" | "approved" | "rejected"
      invite_role: "member" | "officer" | "social_chair"
      invite_status: "pending" | "accepted" | "expired"
      join_request_status: "pending" | "approved" | "rejected"
      user_status: "active" | "inactive" | "suspended"
      user_tier: "free" | "premium" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      budget_period: ["monthly", "semester"],
      event_status: ["planned", "active", "cancelled", "completed"],
      event_visibility: ["public", "chapter-only", "officers-only"],
      expense_category: ["alcohol", "venue", "decor", "security", "misc"],
      expense_status: ["pending", "approved", "rejected"],
      invite_role: ["member", "officer", "social_chair"],
      invite_status: ["pending", "accepted", "expired"],
      join_request_status: ["pending", "approved", "rejected"],
      user_status: ["active", "inactive", "suspended"],
      user_tier: ["free", "premium", "enterprise"],
    },
  },
} as const
