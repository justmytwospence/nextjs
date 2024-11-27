"use client";

import { fetchCourses } from "@/app/actions/fetchCourses";
import CourseCardGrid from "@/components/course-grid";
import SortDropdown, {
	type SortDirection,
	type SortOption,
} from "@/components/course-sort-dropdown";
import TypeDropdown from "@/components/course-type-dropdown";
import Pagination from "@/components/pagination";
import SyncActivitiesButton from "@/components/sync-activities-button";
import SyncRoutesButton from "@/components/sync-routes-button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { baseLogger } from "@/lib/logger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type SelectedTab = "routes" | "activities";

export default function CoursesPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	const [selectedTab, setSelectedTab] = useState<SelectedTab>("routes");
	const [selectedType, setSelectedType] = useState<string | undefined>(
		undefined,
	);
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState<SortOption>("createdAt");
	const [sortDir, setSortDir] = useState<SortDirection>("desc");
	const itemsPerPage = 24;

	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["courses", selectedTab, selectedType, currentPage],
		queryFn: () =>
			fetchCourses(selectedTab, selectedType, currentPage),
		placeholderData: (prev) => prev,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});

	const totalCourses = data?.countsTotal || 0;
	const courseCounts = data?.countsByType || {};
	const totalCoursesForType = !selectedType
		? totalCourses
		: courseCounts[selectedType] || 0;
	const totalPages = Math.ceil(totalCoursesForType / itemsPerPage);
	const courseTypes = Object.keys(courseCounts);

	function prefetchType(filterType: string) {
		queryClient.prefetchQuery({
			queryKey: ["courses", selectedTab, filterType, 1],
			queryFn: () => fetchCourses(selectedTab, filterType, 1),
			staleTime: Number.POSITIVE_INFINITY,
			gcTime: Number.POSITIVE_INFINITY,
		})
	}

	useEffect(() => {
		courseTypes.map(prefetchType);
	}, [courseTypes]);

	useEffect(() => {
		if (currentPage < totalPages) {
			queryClient.prefetchQuery({
				queryKey: ["courses", selectedTab, selectedType, currentPage + 1],
				queryFn: () =>
					fetchCourses(selectedTab, selectedType, currentPage + 1),
				staleTime: Number.POSITIVE_INFINITY,
				gcTime: Number.POSITIVE_INFINITY,
			})
		}
	}, [courseTypes, currentPage]);

	const handleTypeChange = (type?: string) => {
		baseLogger.debug(`Selected type: ${type}`);
		setSelectedType(type);
		setCurrentPage(1);
	};

	const handleTabChange = (value: SelectedTab) => {
		setSelectedTab(value);
		setSelectedType(undefined);
		setCurrentPage(1);
	};

	const handleSortChange = (value: SortOption) => {
		setSortBy(value);
	};

	const handleSortDirToggle = () => {
		setSortDir(sortDir === "asc" ? "desc" : "asc");
	};

	return (
		<div className="mt-8">
			<div className="flex justify-between items-center mb-4">
				<Tabs
					value={selectedTab}
					onValueChange={(value) =>
						handleTabChange(value as "routes" | "activities")
					}
				>
					<TabsList>
						<TabsTrigger value="routes">Routes</TabsTrigger>
						<TabsTrigger value="activities">Activities</TabsTrigger>
					</TabsList>
				</Tabs>
				{selectedTab === "routes" ? (
					<SyncRoutesButton />
				) : (
					<SyncActivitiesButton />
				)}
			</div>
			{isLoading ? (
				<div className="flex justify-center items-center h-screen">
					<Spinner className="h-8 w-8" />
				</div>
			) : !data?.courses ? (
				<p>Please Sync Strava</p>
			) : (
				<>
					<div className="flex justify-between items-center mb-4">
						<div className="flex space-x-4">
							<TypeDropdown
								selectedType={selectedType}
								courseTypes={courseTypes}
								handleTypeChange={handleTypeChange}
							/>
							<SortDropdown
								sortBy={sortBy}
								sortDir={sortDir}
								handleSortChange={handleSortChange}
								handleSortDirToggle={handleSortDirToggle}
							/>
						</div>
						<div className="flex justify-end">
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								handlePageChange={setCurrentPage}
							/>
						</div>
					</div>
					<CourseCardGrid
						courses={data.courses}
						sortBy={sortBy}
						sortDir={sortDir}
					/>
				</>
			)}
		</div>
	);
}
