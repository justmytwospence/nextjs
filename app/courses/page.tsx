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
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type SelectedTab = "routes" | "activities";

export default function CoursesPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialTab = (searchParams.get("tab") as SelectedTab) || "routes";
	const initialType = searchParams.get("type") || undefined;
	const initialPage = parseInt(searchParams.get("page") || "1", 10);
	const initialSortBy = (searchParams.get("sortBy") as SortOption) || "createdAt";
	const initialSortDir = (searchParams.get("sortDir") as SortDirection) || "desc";

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	const [selectedTab, setSelectedTab] = useState<SelectedTab>(initialTab);
	const [selectedType, setSelectedType] = useState<string | undefined>(initialType);
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
	const [sortDir, setSortDir] = useState<SortDirection>(initialSortDir);
	const itemsPerPage = 16;

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

	const updateUrlParameter = (key: string, value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set(key, value);
		router.push(`/courses?${params.toString()}`);
	};

	const handleTypeChange = (type?: string) => {
		baseLogger.debug(`Selected type: ${type}`);
		setSelectedType(type);
		setCurrentPage(1);
		updateUrlParameter("type", type || "");
	};

	const handleTabChange = (value: SelectedTab) => {
		setSelectedTab(value);
		setSelectedType(undefined);
		setCurrentPage(1);
		updateUrlParameter("tab", value);
	};

	const handleSortChange = (value: SortOption) => {
		setSortBy(value);
		updateUrlParameter("sortBy", value);
	};

	const handleSortDirToggle = () => {
		const newSortDir = sortDir === "asc" ? "desc" : "asc";
		setSortDir(newSortDir);
		updateUrlParameter("sortDir", newSortDir);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		updateUrlParameter("page", page.toString());
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
								handlePageChange={handlePageChange}
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
