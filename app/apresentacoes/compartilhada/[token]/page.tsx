import { notFound } from "next/navigation";

import { SharedPresentation } from "@/components/shared-presentation";
import { deckFromRecords, type PresentationRecord, type PresentationSlideRecord } from "@/lib/ai/presentations/records";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SharedPresentationPage({ params }: { params: { token: string } }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.token)) notFound();
  const admin = getSupabaseAdminClient();
  if (!admin) notFound();

  const { data: presentation } = await admin
    .from("presentations")
    .select("*")
    .eq("share_token", params.token)
    .eq("is_public", true)
    .eq("status", "generated")
    .maybeSingle<PresentationRecord>();
  if (!presentation) notFound();

  const { data: slides } = await admin
    .from("presentation_slides")
    .select("id, order_index, slide_type, title, subtitle, body, visual, speaker_notes, sources")
    .eq("presentation_id", presentation.id)
    .order("order_index", { ascending: true })
    .returns<PresentationSlideRecord[]>();
  if (!slides?.length) notFound();

  return <SharedPresentation deck={deckFromRecords(presentation, slides)} />;
}
