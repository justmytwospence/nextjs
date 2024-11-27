import CourseCard from "@/components/course-card";
import type { Course } from "@prisma/client";

type CourseCardGridProps = {
	courses: Course[];
	sortBy: string;
	sortDir: "asc" | "desc";
};

export default function CourseCardGrid({
	courses,
	sortBy,
	sortDir,
}: CourseCardGridProps) {

	const sortedCourses = [...courses].sort((a, b) => {
		switch (sortDir) {
			case "asc":
				return a[sortBy] > b[sortBy] ? 1 : -1;
			case "desc":
				return a[sortBy] < b[sortBy] ? 1 : -1;
		}
	});

	return (
		<div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{sortedCourses.map((course) => (
				<CourseCard key={course.id} course={course} />
			))}
		</div>
	);
}
