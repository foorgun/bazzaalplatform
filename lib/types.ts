export type Role = "bazzaal" | "creator" | "brand";
export type CampaignStatus = "draft" | "active" | "completed";
export type CandidateStatus = "pending" | "approved" | "rejected";
export type ShipmentStatus = "preparing" | "shipped" | "delivered";
export type PostStatus = "pending" | "posted";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role | null;
  brand_name: string | null;
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  brand_name: string;
  client_name: string | null;
  month: string | null;
  platform: string[] | null;
  target_countries: string[] | null;
  min_followers: number | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  guidelines_sent_at: string | null;
  shared_with_client_at: string | null;
  shipment_created_at: string | null;
  content_posted_at: string | null;
  completed_at: string | null;
  target_influencer_count: number | null;
  created_at: string;
};

export type Influencer = {
  id: string;
  full_name: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  followers_count: number | null;
  tiktok_followers: number | null;
  engagement_rate: number | null;
  country: string | null;
  niche: string | null;
  age_range: string | null;
  ethnicity: string | null;
  email: string | null;
  status: "active" | "inactive";
  notes: string | null;
  median_likes: number | null;
  median_comments: number | null;
  median_views: number | null;
  created_at: string;
  updated_at: string | null;
};

export type CampaignCandidate = {
  id: string;
  campaign_id: string;
  influencer_id: string;
  status: CandidateStatus;
  applied_at: string;
  reviewed_at: string | null;
  notes: string | null;
  ig_content_quality: string | null;
  ig_content_style: string[] | null;
  tt_content_quality: string | null;
  tt_content_style: string[] | null;
  brand_fit: boolean | null;
  screening_notes: string | null;
  keep_an_eye: boolean | null;
  last_modified_by: string | null;
};

export type Shipment = {
  id: string;
  campaign_id: string;
  influencer_id: string;
  tracking_number: string | null;
  carrier: "DHL" | "ShipHero" | null;
  status: ShipmentStatus;
  updated_at: string;
};

export type FinalListRow = {
  id: string;
  campaign_id: string;
  influencer_id: string;
  approved_at: string;
  post_status: PostStatus;
  follow_up_round: number | null;
  follow_up_date: string | null;
};

/** Row shapes returned by the joined selects used across pages. */
export type CandidateWithRelations = CampaignCandidate & {
  influencers: Influencer | null;
  campaigns: Pick<Campaign, "id" | "name" | "brand_name" | "status"> | null;
};

/** Screening needs the campaign's target count and setup fields too. */
export type ScreeningCandidate = CampaignCandidate & {
  influencers: Influencer | null;
  campaigns: Pick<
    Campaign,
    | "id"
    | "name"
    | "brand_name"
    | "status"
    | "client_name"
    | "month"
    | "platform"
    | "target_countries"
    | "target_influencer_count"
  > | null;
};

export type ShipmentWithRelations = Shipment & {
  influencers: Pick<Influencer, "id" | "full_name" | "instagram_handle"> | null;
  campaigns: Pick<Campaign, "id" | "name" | "brand_name"> | null;
};

export type FinalListWithRelations = FinalListRow & {
  influencers: Pick<Influencer, "id" | "full_name" | "instagram_handle" | "followers_count"> | null;
  campaigns: Pick<Campaign, "id" | "name" | "brand_name"> | null;
};
