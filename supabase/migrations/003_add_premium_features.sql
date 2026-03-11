-- Migration: Add premium features for direct Monero mining
-- Purpose: Store user premium status and custom Monero wallet address

-- 1. Add columns to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "is_premium" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "xmr_wallet" TEXT;

-- 2. Add an index for premium status
CREATE INDEX IF NOT EXISTS "idx_users_is_premium" ON "public"."users" ("is_premium");

-- 3. Comment on columns for clarity
COMMENT ON COLUMN "public"."users"."is_premium" IS 'Whether the user has purchased the direct mining feature (29 USDC)';
COMMENT ON COLUMN "public"."users"."xmr_wallet" IS 'Custom Monero wallet address for direct mining';
