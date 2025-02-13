import * as turf from "@turf/turf";

export function computeDistanceMiles(coordinates: number[][]): number[] {
  let cumulativeDistance = 0;
  return coordinates.map((point, index, coords) => {
    if (index === 0) return 0;
    const from = turf.point(coords[index - 1]);
    const to = turf.point(point);
    const distance = turf.distance(from, to, { units: "miles" });
    cumulativeDistance += distance;
    return cumulativeDistance;
  });
}

export function removeStaticPoints(coords: number[][], toleranceMeters = 10): number[][] {
  const filteredCoords = coords.filter((coord, index) => {
    if (index === 0) return true;
    const from = turf.point(coords[index - 1]);
    const to = turf.point(coord);
    const distance = turf.distance(from, to, { units: "meters" });
    return distance > toleranceMeters;
  });
  return filteredCoords;
}

function smoothArray(arr: number[], windowSize = 10): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;
    for (
      let j = Math.max(0, i - Math.floor(windowSize / 2));
      j <= Math.min(arr.length - 1, i + Math.floor(windowSize / 2));
      j++
    ) {
      sum += arr[j];
      count++;
    }
    result.push(count === 0 ? 0 : sum / count);
  }
  return result;
}

export function computeGradient(coordinates: number[][]): number[] {
  const rawGradients = coordinates.map((point, index, coords) => {
    if (index === 0) return 0;
    const distance = turf.distance(
      turf.point(coords[index - 1]), // from
      turf.point(point),  // to
      { units: "meters" }
    );
    const elevationChange = (point[2] - coords[index - 1][2]);
    return elevationChange / distance;
  });

  return smoothArray(rawGradients);
}

export function computeCdf(data: number[], range: number[]): number[] {
  const sorted = [...data].sort((a, b) => a - b);
  const cdf: number[] = [];
  let cumulativeCount = 0;
  let dataIndex = 0;

  for (const x of range) {
    while (dataIndex < sorted.length && sorted[dataIndex] <= x) {
      cumulativeCount++;
      dataIndex++;
    }
    cdf.push(cumulativeCount / sorted.length);
  }

  return cdf;
}
