import findPath, { type Bounds } from "@/app/actions/findPath";
import { Button } from "@/components/ui/button";
import type { Aspect } from "@/pathfinder/index.d.ts";
import type { FeatureCollection, LineString, Point } from "geojson";
import { Loader } from "lucide-react";
import { toast } from "sonner";

interface FindPathButtonProps {
  waypoints: Point[];
  bounds: Bounds | null;
  maxGradient: number;
  excludedAspects: Aspect[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setPath: (path: LineString | null, invocationCounter: number) => void;
  setPathAspects: (aspectPoints: FeatureCollection) => void;
  setAspectRaster: (
    azimuthRaster: Uint8Array,
    gradientRaster: Uint8Array
  ) => void;
}

export default function FindPathButton({
  waypoints,
  bounds,
  maxGradient,
  excludedAspects,
  isLoading,
  setIsLoading,
  setPath,
  setPathAspects,
  setAspectRaster,
}: FindPathButtonProps) {
  async function handleClick() {
    if (!bounds) return;
    setIsLoading(true);
    toast.dismiss();

    const pathGenerator = await findPath(
      waypoints,
      bounds,
      maxGradient,
      excludedAspects
    );

    let pathSegmentCounter = 0;
    for await (const result of pathGenerator) {
      switch (result.type) {
        case "info":
          toast.dismiss();
          toast.message(result.message, { duration: Number.POSITIVE_INFINITY });
          break;
        case "success":
          toast.dismiss();
          toast.success(result.message);
          break;
        case "warning":
          toast.warning(result.message);
          break;
        case "error":
          toast.dismiss();
          toast.error(result.message);
          setIsLoading(false);
          break;
        case "rasterResult": {
          toast.dismiss();
          toast.success("Azimuths and gradients computed");
          const { elevations, azimuths, gradients } = result.result;
          setAspectRaster(new Uint8Array(azimuths), new Uint8Array(gradients));
          break;
        }
        case "geoJsonResult": {
          toast.dismiss();
          toast.success("Path found!");
          const path = {
            type: "LineString",
            coordinates: JSON.parse(result.result).features.map(
              (point) => point.geometry.coordinates
            ),
          } as LineString;
          setPath(path, pathSegmentCounter);
          setPathAspects(JSON.parse(result.result));
          pathSegmentCounter++;
          break;
        }
      }
    }
    setIsLoading(false);
  }

  return (
    <Button
      className="flex-1"
      onClick={handleClick}
      disabled={waypoints.length < 2}
    >
      {isLoading ? (
        <>
          Find Path
          <Loader className="animate-spin h-4 w-4 ml-2" />
        </>
      ) : (
        "Find Path"
      )}
    </Button>
  );
}
