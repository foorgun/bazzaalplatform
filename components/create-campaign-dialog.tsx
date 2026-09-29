"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activity";
import { BRANDS, CLIENTS, COUNTRIES, MONTHS, PLATFORMS } from "@/lib/campaign-options";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  brand_name: string;
  client_name: string;
  month: string;
  start_date: string;
  platform: string[];
  target_countries: string[];
  min_followers: string;
};

const EMPTY: FormState = {
  name: "",
  brand_name: "",
  client_name: "",
  month: "",
  start_date: "",
  platform: [],
  target_countries: [],
  min_followers: "",
};

/** Postgres / PostgREST codes for "that column does not exist". */
const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);

export function CreateCampaignDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      setForm(EMPTY);
      setErrors({});
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Campaign name is required.";
    if (!form.brand_name) nextErrors.brand_name = "Brand is required.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const base = {
      name: form.name.trim(),
      brand_name: form.brand_name,
      status: "draft" as const,
      start_date: form.start_date || null,
    };

    const extended = {
      ...base,
      client_name: form.client_name || null,
      month: form.month || null,
      platform: form.platform,
      target_countries: form.target_countries,
      min_followers: form.min_followers ? Number(form.min_followers) : null,
    };

    let { error } = await supabase.from("campaigns").insert(extended);

    // Graceful fallback: the extra columns have not been migrated yet
    // (supabase/05_campaign_fields.sql). Save what the schema does accept.
    if (error && MISSING_COLUMN_CODES.has(error.code ?? "")) {
      const retry = await supabase.from("campaigns").insert(base);
      error = retry.error;

      if (!error) {
        close(false);
        router.refresh();
        toast.warning("Campaign created with basic fields only", {
          description: "Run supabase/05_campaign_fields.sql to store brand client, month, platform, countries and min followers.",
        });
        setSaving(false);
        return;
      }
    }

    setSaving(false);

    if (error) {
      toast.error("Could not create campaign", { description: error.message });
      return;
    }

    const created = form.name.trim();
    void logActivity(supabase, {
      type: "campaign",
      message: `New campaign '${created}' was created`,
    });

    close(false);
    router.refresh();
    toast.success("Campaign created", { description: `${created} was added as a draft.` });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" />
          Create Campaign
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              New campaigns start as a draft. You can activate them once guidelines go out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <Field label="Campaign Name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Round Lab Birch Juice Launch"
                className={cn(errors.name && "border-danger/50")}
                autoFocus
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand" required error={errors.brand_name}>
                <Select value={form.brand_name} onValueChange={(v) => set("brand_name", v)}>
                  <SelectTrigger className={cn(errors.brand_name && "border-danger/50")}>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Client">
                <Select value={form.client_name} onValueChange={(v) => set("client_name", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTS.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Month">
                <Select value={form.month} onValueChange={(v) => set("month", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Start Date">
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  className="[color-scheme:dark]"
                />
              </Field>

              <Field label="Platform">
                <MultiSelect
                  options={PLATFORMS}
                  selected={form.platform}
                  onChange={(next) => set("platform", next)}
                  placeholder="Select platform"
                />
              </Field>

              <Field label="Min Followers">
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  inputMode="numeric"
                  value={form.min_followers}
                  onChange={(e) => set("min_followers", e.target.value)}
                  placeholder="e.g. 50000"
                />
              </Field>
            </div>

            <Field label="Target Countries">
              <MultiSelect
                options={COUNTRIES}
                selected={form.target_countries}
                onChange={(next) => set("target_countries", next)}
                placeholder="Select countries"
                searchPlaceholder="Search countries…"
                searchable
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => close(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-accent">*</span>}
      </Label>
      {children}
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
