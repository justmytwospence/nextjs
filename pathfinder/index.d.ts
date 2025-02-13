/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export enum Aspect {
  North = 'North',
  Northeast = 'Northeast',
  East = 'East',
  Southeast = 'Southeast',
  South = 'South',
  Southwest = 'Southwest',
  West = 'West',
  Northwest = 'Northwest',
  Flat = 'Flat'
}
/** Apply a 5x5 Sobel filter to compute azimuth and gradient along azimuth for each pixel on a `Vec<f32>` */
export declare function computeAzimuths(elevationsGeotiff: Buffer): AzimuthResult
export declare function findPathRs(elevationsBuffer: Buffer, start: string, end: string, maxGradient: number | undefined | null, azimuthsBuffer: Buffer, excludedAspects: Array<Aspect> | undefined | null, gradientsBuffer: Buffer, aspectGradientThreshold?: number | undefined | null): string
export declare class AzimuthResult {
  elevations: Buffer
  azimuths: Buffer
  gradients: Buffer
}
