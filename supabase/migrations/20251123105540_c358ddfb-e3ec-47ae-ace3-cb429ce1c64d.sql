-- Add message_id column to tables to link to Telegram message
ALTER TABLE public.tables 
ADD COLUMN message_id BIGINT;