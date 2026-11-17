import type { ContributionCategory, ContributionStatus, WorkshopStage } from '../domain/workshop'

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined }
type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row; Insert: Insert; Update: Update; Relationships: []
}
type Generated = { id?: string }

// Hand-maintained provisional subset; replace with generated types only after the migration runs.
export type Database = {
  public: {
    Tables: {
      workshops: Table<
        { id: string; title: string; join_code: string; active_stage: WorkshopStage; is_active: boolean; created_at: string; updated_at: string },
        Generated & { title: string; join_code: string; active_stage?: WorkshopStage; is_active?: boolean }
      >
      participant_sessions: Table<
        { id: string; workshop_id: string; user_id: string; display_name: string | null; created_at: string; last_seen_at: string },
        Generated & { workshop_id: string; user_id: string; display_name?: string | null }
      >
      contributions: Table<
        { id: string; workshop_id: string; participant_session_id: string; category: ContributionCategory; content: string; status: ContributionStatus; created_at: string; updated_at: string },
        Generated & { workshop_id: string; participant_session_id: string; category: ContributionCategory; content: string; status?: ContributionStatus }
      >
      projection_state: Table<
        { workshop_id: string; active_stage: WorkshopStage; active_poll_id: string | null; story_version_id: string | null; featured_contribution_id: string | null; settings: Json; updated_at: string },
        { workshop_id: string; active_stage?: WorkshopStage; active_poll_id?: string | null; story_version_id?: string | null; featured_contribution_id?: string | null; settings?: Json }
      >
    }
    Views: Record<string, never>
    Functions: {
      create_workshop: { Args: { workshop_title: string; workshop_join_code: string }; Returns: string }
      enroll_participant: { Args: { input_join_code: string; participant_display_name?: string | null }; Returns: string }
      publish_story_version: { Args: { target_workshop: string; target_version: string }; Returns: undefined }
    }
    Enums: {
      workshop_stage: WorkshopStage
      contribution_category: ContributionCategory
      moderation_status: ContributionStatus
    }
    CompositeTypes: Record<string, never>
  }
}
