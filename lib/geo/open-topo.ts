import { baseLogger } from "@/lib/logger";

type OpenTopoDataset = "USGS1m" | "USGS10m" | "USGS30m";

export async function getTopo(
  south: number,
  north: number,
  west: number,
  east: number,
  datasetName: OpenTopoDataset = "USGS10m",
  outputFormat = "GTiff",
  apiKey = "2313f9bc0e417e032bf9ff07fb6a0844" // process.env.OPEN_TOPO_API_KEY
): Promise<ArrayBuffer> {
  const baseUrl = "https://portal.opentopography.org/API/usgsdem";
  const url = `${baseUrl}?datasetName=${datasetName}&south=${south}&north=${north}&west=${west}&east=${east}&outputFormat=${outputFormat}&API_Key=${apiKey}`;
  const response = await fetch(url);
  baseLogger.debug(
    `Open Topo API response: ${response.status} ${response.statusText}`
  );
  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}
