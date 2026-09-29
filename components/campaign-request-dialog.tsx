"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  CAMPAIGN_GOALS,
  CONTENT_STYLES,
  COUNTRIES,
  MONTHS,
  PLATFORMS,
} from "@/lib/campaign-options";
import { cn } from "@/lib/utils";

type FormState = {
  campaign_name: string;
  product_name: string;
  product_description: string;
  campaign_goal: string;
  platform: string[];
  min_followers: string;
  target_countries: string[];
  preferred_content_style: string[];
  influencer_count: string;
  preferred_start_date: string;
  campaign_month: string;
  budget: string;
  additional_notes: string;
};

const EMPTY: FormState = {
  campaign_name: "",
  product_name: "",
  product_description: "",
  campaign_goal: "",
  platform: [],
  min_followers: "",
  target_countries: [],
  preferred_content_style: [],
  influencer_count: "",
  preferred_start_date: "",
  campaign_month: "",
  budget: "",
  additional_notes: "",
};

export function CampaignRequestDialog({ brandName }: { brandName: string | null }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "campaign_name") setError(null);
  }

  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      setForm(EMPTY);
      setError(null);
    }
  }

  function toNumber(value: string) {
    return value ? Number(value) : null;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.campaign_name.trim()) {
      setError("Campaign name is required.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("campaign_requests").insert({
      brand_name: brandName,
      campaign_name: form.campaign_name.trim(),
      product_name: form.product_name || null,
      product_description: form.product_description || null,
      campaign_goal: form.campaign_goal || null,
      platform: form.platform,
      min_followers: toNumber(form.min_followers),
      target_countries: form.target_countries,
      preferred_content_style: form.preferred_content_style,
      influencer_count: toNumber(form.influencer_count),
      preferred_start_date: form.preferred_start_date || null,
      campaign_month: form.campaign_month || null,
      budget: toNumber(form.budget),
      additional_notes: form.additional_notes || null,
    });

    setSaving(false);

    if (insertError) {
      const missingTable = insertError.code === "42P01" || insertError.code === "PGRST205";
      toast.error("Could not submit request", {
        description: missingTable
          ? "Run supabase/09_campaign_requests.sql to create the campaign_requests table."
          : insertError.message,
      });
      return;
    }

    close(false);
    toast.success("Request submitted", {
      description: "The BAZZAAL team will be in touch shortly.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" />
          Request Campaign
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Request New Campaign</DialogTitle>
            <DialogDescription>
              Send a brief to the BAZZAAL team. They will come back with a creator plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 px-6 py-5">
            <Group title="Campaign Info">
              <Field label="Campaign Name" required error={error}>
                <Input
                  value={form.campaign_name}
                  onChange={(e) => set("campaign_name", e.target.value)}
                  placeholder="e.g. Spring Hydration Launch"
                  className={cn(error && "border-danger/50")}
                  autoFocus
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product Name">
                  <Input
                    value={form.product_name}
                    onChange={(e) => set("product_name", e.target.value)}
                    placeholder="e.g. Hyaluronic Serum 50ml"
                  />
                </Field>

                <Field label="Campaign Goal">
                  <Select
                    value={form.campaign_goal}
                    onValueChange={(value) => set("campaign_goal", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_GOALS.map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Product Description">
                <Textarea
                  rows={3}
                  value={form.product_description}
                  onChange={(e) => set("product_description", e.target.value)}
                  placeholder="What the product is, who it is for, and what makes it different."
                />
              </Field>
            </Group>

            <Group title="Influencer Requirements">
              <div className="grid gap-4 sm:grid-cols-2">
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

                <Field label="Preferred Content Style">
                  <MultiSelect
                    options={CONTENT_STYLES}
                    selected={form.preferred_content_style}
                    onChange={(next) => set("preferred_content_style", next)}
                    placeholder="Select styles"
                  />
                </Field>

                <Field label="Number of Influencers Needed">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={form.influencer_count}
                    onChange={(e) => set("influencer_count", e.target.value)}
                    placeholder="e.g. 20"
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
            </Group>

            <Group title="Timeline & Budget">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Preferred Start Date">
                  <Input
                    type="date"
                    value={form.preferred_start_date}
                    onChange={(e) => set("preferred_start_date", e.target.value)}
                    className="[color-scheme:dark]"
                  />
                </Field>

                <Field label="Campaign Month">
                  <Select
                    value={form.campaign_month}
                    onValueChange={(value) => set("campaign_month", value)}
                  >
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

                <Field label="Budget (USD)">
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    inputMode="numeric"
                    value={form.budget}
                    onChange={(e) => set("budget", e.target.value)}
                    placeholder="e.g. 15000"
                  />
                </Field>
              </div>

              <Field label="Additional Notes">
                <Textarea
                  rows={3}
                  value={form.additional_notes}
                  onChange={(e) => set("additional_notes", e.target.value)}
                  placeholder="Anything else the BAZZAAL team should know."
                />
              </Field>
            </Group>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => close(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 w-full border-b border-hairline pb-2 text-2xs uppercase tracking-wider text-ink-faint">
        {title}
      </legend>
      {children}
    </fieldset>
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
  error?: string | null;
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
