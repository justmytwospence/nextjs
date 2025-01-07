import { fetchActivity } from "@/app/actions/fetchActivity";
import { auth } from "@/auth";
import { toCourse } from "@/types/transformers";
import { notFound } from "next/navigation";
import CourseDetail from "../../course-detail";

export default async function RoutePage({ params }) {
	const session = await auth();
	if (!session) {
		return null;
	}

	const { activityId } = await params;

	const enrichedActivity = await fetchActivity(activityId);

	if (!enrichedActivity) {
		notFound();
	}

	const enrichedCourse = toCourse(enrichedActivity);

	return <CourseDetail course={enrichedCourse} />;
}
