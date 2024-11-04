import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      id: 'user_1',
    },
    update: {},
    create: {
      id: 'user_1',
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  await prisma.userRoute.createMany({
    data: [
      {
        id: 'route_1',
        name: 'Morning Ride',
        description: 'A scenic ride through the countryside.',
        distance: 25000,
        elevationGain: 500,
        estimatedMovingTime: 5400,
        private: false,
        starred: true,
        subType: 1,
        timestamp: new Date(),
        summaryPolyline: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [-122.483696, 37.833818],
                  [-122.483482, 37.833174],
                  [-122.483396, 37.8327],
                  [-122.483568, 37.832056],
                  [-122.48404, 37.831141],
                  [-122.48404, 37.830497],
                  [-122.483482, 37.82992],
                  [-122.483568, 37.829548],
                  [-122.48507, 37.829446],
                  [-122.4861, 37.828802],
                  [-122.486958, 37.82931],
                  [-122.487001, 37.830802],
                  [-122.487516, 37.831683],
                  [-122.488031, 37.832158],
                  [-122.488889, 37.832971],
                  [-122.489876, 37.832632],
                  [-122.490434, 37.832937],
                  [-122.49125, 37.832429],
                  [-122.491636, 37.832564],
                  [-122.492237, 37.833378],
                  [-122.493782, 37.833683],
                ],
              },
              properties: {},
            },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      },
      {
        id: 'route_2',
        name: 'City Run',
        description: 'An urban running route.',
        distance: 8000,
        elevationGain: 100,
        estimatedMovingTime: 3600,
        private: true,
        starred: false,
        subType: 5,
        timestamp: new Date(),
        summaryPolyline: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [-122.4194, 37.7749],
                  [-122.4184, 37.7759],
                  [-122.4174, 37.7769],
                  [-122.4164, 37.7779],
                  [-122.4154, 37.7789],
                  [-122.4144, 37.7799],
                  [-122.4134, 37.7809],
                  [-122.4124, 37.7819],
                  [-122.4114, 37.7829],
                  [-122.4104, 37.7839],
                ],
              },
              properties: {},
            },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
