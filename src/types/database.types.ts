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
      articles: {
        Row: {
          category_id: string | null
          content: Json | null
          cover_image_url: string | null
          created_at: string | null
          deleted_at: string | null
          excerpt: Json | null
          id: string
          published_at: string | null
          seo_description: Json | null
          seo_keywords: Json | null
          seo_title: Json | null
          slug: string
          status: Database["public"]["Enums"]["content_status"] | null
          tenant_id: string
          title: Json | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: Json | null
          id?: string
          published_at?: string | null
          seo_description?: Json | null
          seo_keywords?: Json | null
          seo_title?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tenant_id: string
          title?: Json | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: Json | null
          id?: string
          published_at?: string | null
          seo_description?: Json | null
          seo_keywords?: Json | null
          seo_title?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tenant_id?: string
          title?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: Json
          slug: string
          sort_order: number | null
          tenant_id: string
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: Json
          slug: string
          sort_order?: number | null
          tenant_id: string
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: Json
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          alt_text: Json | null
          created_at: string | null
          filename: string
          height: number | null
          id: string
          mime_type: string
          public_url: string
          size: number
          storage_path: string
          tenant_id: string
          width: number | null
        }
        Insert: {
          alt_text?: Json | null
          created_at?: string | null
          filename: string
          height?: number | null
          id?: string
          mime_type: string
          public_url: string
          size: number
          storage_path: string
          tenant_id: string
          width?: number | null
        }
        Update: {
          alt_text?: Json | null
          created_at?: string | null
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string
          public_url?: string
          size?: number
          storage_path?: string
          tenant_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          project_type: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          project_type?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          project_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json | null
          id: string
          page_type: Database["public"]["Enums"]["page_type"]
          seo_description: Json | null
          seo_title: Json | null
          tenant_id: string
          title: Json | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          id?: string
          page_type: Database["public"]["Enums"]["page_type"]
          seo_description?: Json | null
          seo_title?: Json | null
          tenant_id: string
          title?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          id?: string
          page_type?: Database["public"]["Enums"]["page_type"]
          seo_description?: Json | null
          seo_title?: Json | null
          tenant_id?: string
          title?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          area: string | null
          category_id: string | null
          content: Json | null
          cover_image_url: string | null
          created_at: string | null
          deleted_at: string | null
          description: Json | null
          gallery_urls: string[] | null
          id: string
          location: Json | null
          published_at: string | null
          seo_description: Json | null
          seo_keywords: Json | null
          seo_title: Json | null
          slug: string
          status: Database["public"]["Enums"]["content_status"] | null
          tenant_id: string
          title: Json | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          area?: string | null
          category_id?: string | null
          content?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: Json | null
          gallery_urls?: string[] | null
          id?: string
          location?: Json | null
          published_at?: string | null
          seo_description?: Json | null
          seo_keywords?: Json | null
          seo_title?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tenant_id: string
          title?: Json | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          area?: string | null
          category_id?: string | null
          content?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: Json | null
          gallery_urls?: string[] | null
          id?: string
          location?: Json | null
          published_at?: string | null
          seo_description?: Json | null
          seo_keywords?: Json | null
          seo_title?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tenant_id?: string
          title?: Json | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          tenant_id: string
          version: number
        }
        Insert: {
          content: Json
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tenant_id: string
          version: number
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tenant_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "revisions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          allowed_domains: string[] | null
          contact_address: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          favicon_url: string | null
          ga_tracking_id: string | null
          id: string
          logo_url: string | null
          notify_email: string | null
          notify_email_enabled: boolean | null
          notify_line_enabled: boolean | null
          notify_line_token: string | null
          seo_description: Json | null
          seo_keywords: Json | null
          seo_title: Json | null
          site_name: Json | null
          social_links: Json | null
          tagline: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          contact_address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          favicon_url?: string | null
          ga_tracking_id?: string | null
          id?: string
          logo_url?: string | null
          notify_email?: string | null
          notify_email_enabled?: boolean | null
          notify_line_enabled?: boolean | null
          notify_line_token?: string | null
          seo_description?: Json | null
          seo_keywords?: Json | null
          seo_title?: Json | null
          site_name?: Json | null
          social_links?: Json | null
          tagline?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          contact_address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          favicon_url?: string | null
          ga_tracking_id?: string | null
          id?: string
          logo_url?: string | null
          notify_email?: string | null
          notify_email_enabled?: boolean | null
          notify_line_enabled?: boolean | null
          notify_line_token?: string | null
          seo_description?: Json | null
          seo_keywords?: Json | null
          seo_title?: Json | null
          site_name?: Json | null
          social_links?: Json | null
          tagline?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          default_locale: string | null
          domain: string | null
          enabled_features: string[] | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          plan: string | null
          slug: string
          supported_locales: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_locale?: string | null
          domain?: string | null
          enabled_features?: string[] | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          plan?: string | null
          slug: string
          supported_locales?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_locale?: string | null
          domain?: string | null
          enabled_features?: string[] | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          plan?: string | null
          slug?: string
          supported_locales?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: never; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      category_type: "project" | "article"
      content_status: "draft" | "published" | "archived"
      page_type: "home" | "about" | "contact"
      user_role: "super_admin" | "admin" | "editor"
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
    Enums: {
      category_type: ["project", "article"],
      content_status: ["draft", "published", "archived"],
      page_type: ["home", "about", "contact"],
      user_role: ["super_admin", "admin", "editor"],
    },
  },
} as const
