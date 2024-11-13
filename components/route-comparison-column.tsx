"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LazyMap from "@/components/lazy-map";
import { queryUserRouteAction } from "@/app/actions/queryUserRoute";
import { queryActivityAction } from "@/app/actions/queryActivity";
import ElevationChart from "@/components/elevation-chart";
import { Mappable } from "@prisma/client";

export default function RouteComparisonColumn({
  mappables,
  selectedMappable,
  setSelectedMappable,
}: {
  mappables: { id: string; name: string; type: string }[];
  selectedMappable: Mappable | null;
  setSelectedMappable: (mappable: Mappable | null) => void;
}) {
  return (
    <div className="space-y-6 p-6 bg-background border rounded-lg">
      <Select
        onValueChange={async (value) => {
          const [id, type] = value.split("|");
          const fullMappable =
            type === "route"
              ? await queryUserRouteAction(id)
              : await queryActivityAction(id);
          setSelectedMappable(fullMappable);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Route or Activity" />
          <SelectValue>
            {selectedMappable
              ? selectedMappable.name
              : "Select Route or Activity"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {mappables.map((mappable) => (
            <SelectItem
              key={mappable.id}
              value={`${mappable.id}|${mappable.type}`}
            >
              {mappable.name} ({mappable.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMappable && (
        <div className="h-[300px] w-full mt-4">
          <LazyMap mappable={selectedMappable} />
        </div>
      )}

      {selectedMappable && (
        <div className="h-[400px] w-full">
          <ElevationChart mappable={selectedMappable} maxGradient={0.1} />
        </div>
      )}
    </div>
  );
}
