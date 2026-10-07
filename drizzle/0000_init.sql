CREATE TABLE "auth_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"phone" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"orcid" text,
	"user_id" uuid,
	"flow_token_hash" text NOT NULL,
	"start_token_hash" text NOT NULL,
	"telegram_user_id" bigint,
	"telegram_chat_id" bigint,
	"code_hash" text,
	"code_expires_at" timestamp with time zone,
	"code_attempts" integer DEFAULT 0 NOT NULL,
	"codes_sent" integer DEFAULT 0 NOT NULL,
	"last_code_sent_at" timestamp with time zone,
	"ip" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "auth_requests_flow_token_hash_unique" UNIQUE("flow_token_hash"),
	CONSTRAINT "auth_requests_start_token_hash_unique" UNIQUE("start_token_hash"),
	CONSTRAINT "auth_requests_purpose_valid" CHECK ("auth_requests"."purpose" in ('register', 'login')),
	CONSTRAINT "auth_requests_status_valid" CHECK ("auth_requests"."status" in ('pending', 'awaiting_contact', 'code_sent', 'verified', 'failed')),
	CONSTRAINT "auth_requests_register_payload" CHECK ("auth_requests"."purpose" = 'login' or ("auth_requests"."first_name" is not null and "auth_requests"."last_name" is not null and "auth_requests"."orcid" is not null)),
	CONSTRAINT "auth_requests_login_user" CHECK ("auth_requests"."purpose" = 'register' or "auth_requests"."user_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"orcid" text NOT NULL,
	"orcid_verified_at" timestamp with time zone,
	"telegram_user_id" bigint,
	"role" text DEFAULT 'teacher' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_orcid_unique" UNIQUE("orcid"),
	CONSTRAINT "users_telegram_user_id_unique" UNIQUE("telegram_user_id"),
	CONSTRAINT "users_phone_format" CHECK ("users"."phone" ~ '^[+]998[0-9]{9}$'),
	CONSTRAINT "users_orcid_format" CHECK ("users"."orcid" ~ '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$'),
	CONSTRAINT "users_role_valid" CHECK ("users"."role" in ('teacher', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "auth_requests" ADD CONSTRAINT "auth_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_requests_phone_created_idx" ON "auth_requests" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "auth_requests_ip_created_idx" ON "auth_requests" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "auth_requests_telegram_status_idx" ON "auth_requests" USING btree ("telegram_user_id","status");--> statement-breakpoint
CREATE INDEX "auth_requests_user_id_idx" ON "auth_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");