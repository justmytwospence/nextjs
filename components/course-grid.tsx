import CourseCard from "@/components/course-card";
import type { Course } from "@prisma/client";

type CourseCardGridProps = {
  courses: Course[];
  sortBy: string;
  sortDir: "asc" | "desc";
  selectionMode?: boolean;
	selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
};

export default function CourseCardGrid({
  courses,
  sortBy,
  sortDir,
  selectionMode,
  selectedIds = [],
  onToggleSelection,
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
    <div
      className="grid gap-6 justify-center"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
    >
      {sortedCourses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          selected={selectedIds.includes(course.id)}
          selectionMode={selectionMode}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </div>
  );
}
