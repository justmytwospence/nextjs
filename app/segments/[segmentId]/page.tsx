import fetchSegment from "@/app/actions/fetchSegment";
import { auth } from "@/auth";
import SegmentDetail from "@/components/segment-detail";
import { notFound } from "next/navigation";

export default async function SegmentPage({ params }) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { segmentId } = await params;

  const enrichedSegment = await fetchSegment(segmentId);

  if (!enrichedSegment) {
    notFound();
  }

  return <SegmentDetail segment={enrichedSegment} />;
}
