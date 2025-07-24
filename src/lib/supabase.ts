import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          brand: string | null
          model: string | null
          purchase_date: string | null
          warranty_months: number | null
          warranty_expires_at: string | null
          purchase_price: number | null
          receipt_image_url: string | null
          status: 'active' | 'discontinued' | 'broken' | 'sold'
          discontinue_reason: string | null
          is_public: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brand?: string | null
          model?: string | null
          purchase_date?: string | null
          warranty_months?: number | null
          warranty_expires_at?: string | null
          purchase_price?: number | null
          receipt_image_url?: string | null
          status?: 'active' | 'discontinued' | 'broken' | 'sold'
          discontinue_reason?: string | null
          is_public?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          brand?: string | null
          model?: string | null
          purchase_date?: string | null
          warranty_months?: number | null
          warranty_expires_at?: string | null
          purchase_price?: number | null
          receipt_image_url?: string | null
          status?: 'active' | 'discontinued' | 'broken' | 'sold'
          discontinue_reason?: string | null
          is_public?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 