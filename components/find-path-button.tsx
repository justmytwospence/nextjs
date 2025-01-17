import findPath, { type Bounds } from "@/app/actions/findPath";
import { Button } from "@/components/ui/button";
import type { Aspect } from "@/pathfinder/index.d.ts";
import type { FeatureCollection, LineString, Point } from "geojson";
import { Loader } from "lucide-react";
import { toast } from "sonner";

interface FindPathButtonProps {
  waypoints: Point[];
  bounds: Bounds | null;
  excludedAspects: Aspect[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setPath: (path: LineString | null) => void;
  setAspectPoints: (aspectPoints: FeatureCollection | null) => void;
  setAzimuths: (azimuths: Uint8Array) => void;
}

export default function FindPathButton({
  waypoints,
  bounds,
  excludedAspects,
  isLoading,
  setIsLoading,
  setPath,
  setAspectPoints,
  setAzimuths,
}: FindPathButtonProps) {
  async function handleClick() {
    if (!bounds) return;
    setIsLoading(true);
    toast.dismiss();

    try {
      const pathGenerator = await findPath(waypoints, bounds, excludedAspects);

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
            toast.dismiss()
            toast.error(result.message);
            break;
          case "result": {
            toast.dismiss();
            toast.success("Path found!");
            const path = {
              type: "LineString",
              coordinates: JSON.parse(result.result.path).features.map(
                (point) => point.geometry.coordinates
              ),
            } as LineString;
            setPath(path);
            console.log("Setting azimuths from button" )
            setAzimuths(new Uint8Array(result.result.azimuths));
            setAspectPoints(JSON.parse(result.result.path));
            break;
          }
        }
      }
    } catch (error) {
      // Error handling is already managed by the generator
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button className="flex-1" onClick={handleClick} disabled={waypoints.length < 2}>
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
