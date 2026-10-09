ALTER TABLE "users" DROP CONSTRAINT "users_role_valid";--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "issue_no" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "issue_seq" smallint;--> statement-breakpoint
-- Existing articles go to issue 1: ever-published ones numbered 1, 2, 3... in first-publication order,
-- the rest get the following numbers as their proposal. Must run before the unique index and the CHECKs.
UPDATE "articles" AS a SET "issue_seq" = n.rn,
  "updated_at" = CASE WHEN a."status" = 'published' THEN now() ELSE a."updated_at" END
FROM (SELECT "id", row_number() OVER (ORDER BY "published_at", "id") AS rn FROM "articles" WHERE "published_at" IS NOT NULL) AS n
WHERE a."id" = n."id";--> statement-breakpoint
UPDATE "articles" AS a SET "issue_seq" = n.rn + (SELECT count(*) FROM "articles" WHERE "published_at" IS NOT NULL)
FROM (SELECT "id", row_number() OVER (ORDER BY "id") AS rn FROM "articles" WHERE "published_at" IS NULL) AS n
WHERE a."id" = n."id";--> statement-breakpoint
CREATE UNIQUE INDEX "articles_issue_slot_uq" ON "articles" USING btree ("issue_no","issue_seq") WHERE "articles"."status" = 'published';--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_issue_no_valid" CHECK ("articles"."issue_no" between 1 and 999);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_issue_seq_valid" CHECK ("articles"."issue_seq" between 1 and 999);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_valid" CHECK ("users"."role" in ('teacher', 'moderator', 'admin'));
