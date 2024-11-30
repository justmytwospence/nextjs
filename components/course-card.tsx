import LazyMap from "@/components/lazy-map";
import { Card } from "@/components/ui/card";
import type { Course } from "@prisma/client";
import { Clock, Navigation, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

type CourseCardProps = {
  course: Course;
};

function formatDuration(duration: number) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();

  function handleCardClick() {
    router.push(`/courses/${course.courseType}/${course.id}`);
  }

  return (
    <Card
      className="group transition-all duration-200 rounded-md overflow-hidden hover:cursor-pointer h-full w-full aspect-auto flex flex-col bg-white"
      onClick={handleCardClick}
    >
      <div className="relative h-48 w-full">
        <LazyMap polyline={course.summaryPolyline} interactive={false} />
      </div>
      <div className="flex-grow p-4 space-y-3">
        <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
          {course.name}
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-muted-foreground font-bold" />
            <span className="text-sm font-bold">
              {(course.distance / 1609.34).toFixed(1)}mi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground font-bold" />
            <span className="text-sm font-bold">
              {Math.round(course.elevationGain * 3.28084).toLocaleString()}ft
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground font-bold" />
            <span className="text-sm font-bold">{formatDuration(course.duration)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
