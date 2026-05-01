import { PrismaClient } from '@prisma/client';
import https from 'https';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const INEC_DATA_URL = 'https://raw.githubusercontent.com/sadiqsalau/inec-ng-data/main/inecdata.json';

// Zone mapping for Nigerian states
const ZONE_FOR_STATE: Record<string, string> = {
  'ABIA': 'SE', 'ADAMAWA': 'NE', 'AKWA IBOM': 'SS', 'ANAMBRA': 'SE',
  'BAUCHI': 'NE', 'BAYELSA': 'SS', 'BENUE': 'NC', 'BORNO': 'NE',
  'CROSS RIVER': 'SS', 'DELTA': 'SS', 'EBONYI': 'SE', 'EDO': 'SS',
  'EKITI': 'SW', 'ENUGU': 'SE', 'FCT': 'NC', 'GOMBE': 'NE',
  'IMO': 'SE', 'JIGAWA': 'NW', 'KADUNA': 'NW', 'KANO': 'NW',
  'KATSINA': 'NW', 'KEBBI': 'NW', 'KOGI': 'NC', 'KWARA': 'NC',
  'LAGOS': 'SW', 'NASARAWA': 'NC', 'NIGER': 'NC', 'OGUN': 'SW',
  'ONDO': 'SW', 'OSUN': 'SW', 'OYO': 'SW', 'PLATEAU': 'NC',
  'RIVERS': 'SS', 'SOKOTO': 'NW', 'TARABA': 'NE', 'YOBE': 'NE',
  'ZAMFARA': 'NW',
};

const ZONES = [
  { name: 'North-Central', code: 'NC' },
  { name: 'North-East', code: 'NE' },
  { name: 'North-West', code: 'NW' },
  { name: 'South-East', code: 'SE' },
  { name: 'South-South', code: 'SS' },
  { name: 'South-West', code: 'SW' },
];

function downloadJSON(url: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    console.log('   Downloading...');
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadJSON(res.headers.location!).then(resolve, reject);
      }
      let data = '';
      let mb = 0;
      res.on('data', (chunk: Buffer) => {
        data += chunk;
        const newMb = Math.floor(data.length / (1024 * 1024));
        if (newMb > mb) { mb = newMb; process.stdout.write(`   ${mb}MB downloaded...\r`); }
      });
      res.on('end', () => {
        console.log(`   ${Math.round(data.length / 1024 / 1024)}MB downloaded. Parsing...`);
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function seed() {
  console.log('🌍 INEC Full Database Seed');
  console.log('==========================\n');

  // Step 1: Download
  console.log('📥 Step 1: Fetching INEC dataset (~35MB)...');
  const inecData = await downloadJSON(INEC_DATA_URL);
  console.log(`   ✅ Got data for ${inecData.length} states.\n`);

  // Step 2: Clear existing geo data
  console.log('🗑️  Step 2: Clearing existing geo data...');
  // First unlink any users from geo records so FK constraints don't block
  await prisma.user.updateMany({ data: { pollingUnitId: null, wardId: null, lgaId: null, stateId: null, zoneId: null } });
  console.log('   Unlinked users from geo records');
  // Now delete in order due to foreign keys
  await prisma.pollingUnit.deleteMany();
  console.log('   Cleared polling units');
  await prisma.ward.deleteMany();
  console.log('   Cleared wards');
  await prisma.lga.deleteMany();
  console.log('   Cleared LGAs');
  await prisma.state.deleteMany();
  console.log('   Cleared states');
  await prisma.zone.deleteMany();
  console.log('   Cleared zones');
  console.log('   ✅ Done.\n');

  // Step 3: Create Zones
  console.log('🌐 Step 3: Creating 6 zones...');
  const zoneIdMap: Record<string, string> = {};
  for (const z of ZONES) {
    const id = randomUUID();
    zoneIdMap[z.code] = id;
  }
  await prisma.zone.createMany({
    data: ZONES.map(z => ({ id: zoneIdMap[z.code], name: z.name, code: z.code })),
  });
  console.log('   ✅ 6 zones created.\n');

  // Step 4: Build all data arrays in memory with pre-generated UUIDs
  console.log('🔧 Step 4: Building data arrays in memory...');
  const statesData: any[] = [];
  const lgasData: any[] = [];
  const wardsData: any[] = [];
  const pusData: any[] = [];

  for (const s of inecData) {
    const stateName = s.name.toUpperCase().trim();
    const zoneCode = ZONE_FOR_STATE[stateName] || 'NC';
    const stateId = randomUUID();
    const stateCode = stateName.substring(0, 2);

    statesData.push({
      id: stateId,
      name: stateName.split(' ').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      code: stateCode,
      zoneId: zoneIdMap[zoneCode],
    });

    for (const l of (s.lgas || [])) {
      const lgaId = randomUUID();
      lgasData.push({
        id: lgaId,
        name: l.name,
        stateId: stateId,
      });

      for (const w of (l.wards || [])) {
        const wardId = randomUUID();
        wardsData.push({
          id: wardId,
          name: w.name,
          lgaId: lgaId,
        });

        for (const u of (w.units || [])) {
          // Build globally unique PU code: stateInecId/lgaAbbrev/wardAbbrev/unitAbbrev
          const puCode = `${s.id}/${l.abbreviation || l.id}/${w.abbreviation || w.id}/${u.abbreviation}`;
          pusData.push({
            name: u.name,
            code: puCode,
            wardId: wardId,
          });
        }
      }
    }
  }

  console.log(`   States: ${statesData.length}`);
  console.log(`   LGAs:   ${lgasData.length}`);
  console.log(`   Wards:  ${wardsData.length}`);
  console.log(`   PUs:    ${pusData.length}`);
  console.log('   ✅ All arrays ready.\n');

  // Step 5: Batch insert States
  console.log('📦 Step 5: Inserting states...');
  await prisma.state.createMany({ data: statesData, skipDuplicates: true });
  console.log(`   ✅ ${statesData.length} states inserted.\n`);

  // Step 6: Batch insert LGAs (chunk by 2000)
  console.log('📦 Step 6: Inserting LGAs...');
  for (let i = 0; i < lgasData.length; i += 2000) {
    const chunk = lgasData.slice(i, i + 2000);
    await prisma.lga.createMany({ data: chunk, skipDuplicates: true });
    console.log(`   ... ${Math.min(i + 2000, lgasData.length)} / ${lgasData.length}`);
  }
  console.log(`   ✅ ${lgasData.length} LGAs inserted.\n`);

  // Step 7: Batch insert Wards (chunk by 2000)
  console.log('📦 Step 7: Inserting Wards...');
  for (let i = 0; i < wardsData.length; i += 2000) {
    const chunk = wardsData.slice(i, i + 2000);
    await prisma.ward.createMany({ data: chunk, skipDuplicates: true });
    console.log(`   ... ${Math.min(i + 2000, wardsData.length)} / ${wardsData.length}`);
  }
  console.log(`   ✅ ${wardsData.length} wards inserted.\n`);

  // Step 8: Batch insert Polling Units (chunk by 3000)
  console.log('📦 Step 8: Inserting Polling Units (this is the big one)...');
  for (let i = 0; i < pusData.length; i += 3000) {
    const chunk = pusData.slice(i, i + 3000);
    await prisma.pollingUnit.createMany({ data: chunk, skipDuplicates: true });
    console.log(`   ... ${Math.min(i + 3000, pusData.length)} / ${pusData.length}`);
  }
  console.log(`   ✅ ${pusData.length} polling units inserted.\n`);

  console.log('🎉 INEC SEED COMPLETE!');
  console.log(`   ${statesData.length} States | ${lgasData.length} LGAs | ${wardsData.length} Wards | ${pusData.length} Polling Units`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
