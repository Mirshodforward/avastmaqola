CREATE TABLE "zenodo_deposits" (
	"article_id" integer NOT NULL,
	"host" text NOT NULL,
	"status" text NOT NULL,
	"zenodo_user_id" text,
	"record_id" text,
	"doi" text,
	"error" text,
	"error_detail" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zenodo_deposits_article_id_host_pk" PRIMARY KEY("article_id","host"),
	CONSTRAINT "zenodo_deposits_status_valid" CHECK ("zenodo_deposits"."status" in ('in_progress', 'published', 'failed')),
	CONSTRAINT "zenodo_deposits_doi_format" CHECK ("zenodo_deposits"."doi" ~ '^10[.][0-9]{4,9}/[^[:space:]]+$'),
	CONSTRAINT "zenodo_deposits_published_complete" CHECK ("zenodo_deposits"."status" <> 'published' or ("zenodo_deposits"."doi" is not null and "zenodo_deposits"."record_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "zenodo_deposits" ADD CONSTRAINT "zenodo_deposits_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;