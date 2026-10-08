CREATE TABLE "article_authors" (
	"article_id" integer NOT NULL,
	"position" smallint NOT NULL,
	"user_id" uuid,
	"given_name" text NOT NULL,
	"family_name" text NOT NULL,
	"institution" text,
	"orcid" text,
	CONSTRAINT "article_authors_article_id_position_pk" PRIMARY KEY("article_id","position"),
	CONSTRAINT "article_authors_orcid_format" CHECK ("article_authors"."orcid" ~ '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$')
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "articles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"lang" text,
	"title_uz" text,
	"title_ru" text,
	"title_en" text,
	"abstract_uz" text,
	"abstract_ru" text,
	"abstract_en" text,
	"keywords_uz" text[] DEFAULT '{}'::text[] NOT NULL,
	"keywords_ru" text[] DEFAULT '{}'::text[] NOT NULL,
	"keywords_en" text[] DEFAULT '{}'::text[] NOT NULL,
	"license" text DEFAULT 'cc-by-4.0' NOT NULL,
	"rights_confirmed_at" timestamp with time zone,
	"pdf_key" text,
	"pdf_bytes" integer,
	"review_note" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_status_valid" CHECK ("articles"."status" in ('draft', 'submitted', 'published', 'rejected')),
	CONSTRAINT "articles_lang_valid" CHECK ("articles"."lang" in ('uz', 'ru', 'en')),
	CONSTRAINT "articles_license_valid" CHECK ("articles"."license" in ('cc-by-4.0', 'cc-by-nc-4.0', 'all-rights-reserved')),
	CONSTRAINT "articles_complete_unless_editable" CHECK ("articles"."status" in ('draft', 'rejected') or ("articles"."lang" is not null and "articles"."pdf_key" is not null
        and "articles"."rights_confirmed_at" is not null
        and btrim(coalesce("articles"."title_uz", '')) <> '' and btrim(coalesce("articles"."title_ru", '')) <> '' and btrim(coalesce("articles"."title_en", '')) <> ''
        and btrim(coalesce("articles"."abstract_uz", '')) <> '' and btrim(coalesce("articles"."abstract_ru", '')) <> '' and btrim(coalesce("articles"."abstract_en", '')) <> ''
        and cardinality("articles"."keywords_uz") > 0 and cardinality("articles"."keywords_ru") > 0 and cardinality("articles"."keywords_en") > 0)),
	CONSTRAINT "articles_published_has_date" CHECK ("articles"."status" <> 'published' or "articles"."published_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_authors_user_idx" ON "article_authors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "articles_user_idx" ON "articles" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status","submitted_at");