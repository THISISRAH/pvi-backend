import prisma from '../../src/config/database';

async function check() {
  const [states, lgas, wards, pus] = await Promise.all([
    prisma.state.count(),
    prisma.lga.count(),
    prisma.ward.count(),
    prisma.pollingUnit.count(),
  ]);
  console.log(`States: ${states}, LGAs: ${lgas}, Wards: ${wards}, Polling Units: ${pus}`);
  if (wards === 0) {
    console.log('⚠️  Database has NO wards! The seed did not complete.');
  } else {
    console.log('✅ Database has real data!');
  }
  await prisma.$disconnect();
}
check();
