ALTER TABLE "auth_requests" DROP CONSTRAINT "auth_requests_register_payload";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "orcid" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_requests" DROP COLUMN "orcid";--> statement-breakpoint
ALTER TABLE "auth_requests" ADD CONSTRAINT "auth_requests_register_payload" CHECK ("auth_requests"."purpose" = 'login' or ("auth_requests"."first_name" is not null and "auth_requests"."last_name" is not null));