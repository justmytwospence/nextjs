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
        type: 1,
        subType: 1,
        timestamp: new Date(),
        summaryPolyline: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [-122.483696, 37.833818, 10],
                [-122.483482, 37.833174, 15],
                [-122.483396, 37.8327, 20],
                [-122.483568, 37.832056, 25],
                [-122.48404, 37.831141, 30],
                [-122.48404, 37.830497, 35],
                [-122.483482, 37.82992, 40],
                [-122.483568, 37.829548, 45],
                [-122.48507, 37.829446, 50],
                [-122.4861, 37.828802, 55],
                [-122.486958, 37.82931, 60],
                [-122.487001, 37.830802, 65],
                [-122.487516, 37.831683, 70],
                [-122.488031, 37.832158, 75],
                [-122.488889, 37.832971, 80],
                [-122.489876, 37.832632, 85],
                [-122.490434, 37.832937, 90],
                [-122.49125, 37.832429, 95],
                [-122.491636, 37.832564, 100],
                [-122.492237, 37.833378, 105],
                [-122.493782, 37.833683, 110],
              ]
            },
            properties: {},
          }],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user_1",
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
        type: 5,
        subType: 5,
        timestamp: new Date(),
        summaryPolyline: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [-122.4194, 37.7749, 5],
                [-122.4184, 37.7759, 10],
                [-122.4174, 37.7769, 15],
                [-122.4164, 37.7779, 20],
                [-122.4154, 37.7789, 25],
                [-122.4144, 37.7799, 30],
                [-122.4134, 37.7809, 35],
                [-122.4124, 37.7819, 40],
                [-122.4114, 37.7829, 45],
                [-122.4104, 37.7839, 50],
              ],
            },
            properties: {},
          }],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user_1",
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
