-- Add isReleased column to RecruitmentAuditionEvent
ALTER TABLE "recruitment_audition_events" ADD COLUMN "is_released" BOOLEAN NOT NULL DEFAULT false;