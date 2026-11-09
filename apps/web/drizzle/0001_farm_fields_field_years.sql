CREATE TABLE "farms" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Mein Hof' NOT NULL,
	"strasse" text,
	"plz" text,
	"ort" text,
	"lat" double precision,
	"lon" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_years" (
	"id" text PRIMARY KEY NOT NULL,
	"field_id" text NOT NULL,
	"jahr" integer NOT NULL,
	"crop" text DEFAULT 'mais' NOT NULL,
	"variety_id" text,
	"variety_text" text,
	"usage" text,
	"status" text DEFAULT 'geplant' NOT NULL,
	"area_ha" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "farm_id" text;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "status" text DEFAULT 'status-ok' NOT NULL;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_years" ADD CONSTRAINT "field_years_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "farms_user_id_idx" ON "farms" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "field_years_field_id_jahr_idx" ON "field_years" USING btree ("field_id","jahr");--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE set null ON UPDATE no action;