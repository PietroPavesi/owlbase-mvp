import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (for TypeScript)
export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          created_at: string
        }
      }
      experts: {
        Row: {
          id: string
          client_id: string
          email: string
          name: string
          preferred_name: string | null
          pronouns: string | null
          phone: string | null
          role: string
          department: string
          years_experience: number
          areas_specialization: string | null
          previous_roles: string | null
          created_at: string
        }
      }
      sessions: {
        Row: {
          id: string
          expert_id: string
          title: string
          status: 'draft' | 'in_progress' | 'completed'
          conversation_data: any
          started_at: string
          updated_at: string
        }
      }
      documents: {
        Row: {
          id: string
          session_id: string
          expert_id: string
          type: 'process_documents' | 'training_materials' | 'decision_trees' | 'ai_training_data'
          title: string
          content: string
          created_at: string
        }
      }
    }
  }
}