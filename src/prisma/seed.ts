import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── NIGERIA GEO DATA ──────────────────────────────────

const ZONES = [
  { name: 'North-Central', code: 'NC' },
  { name: 'North-East', code: 'NE' },
  { name: 'North-West', code: 'NW' },
  { name: 'South-East', code: 'SE' },
  { name: 'South-South', code: 'SS' },
  { name: 'South-West', code: 'SW' },
];

const STATES_BY_ZONE: Record<string, { name: string; code: string }[]> = {
  'NC': [
    { name: 'Benue', code: 'BN' },
    { name: 'Kogi', code: 'KG' },
    { name: 'Kwara', code: 'KW' },
    { name: 'Nasarawa', code: 'NS' },
    { name: 'Niger', code: 'NI' },
    { name: 'Plateau', code: 'PL' },
    { name: 'Federal Capital Territory', code: 'FC' },
  ],
  'NE': [
    { name: 'Adamawa', code: 'AD' },
    { name: 'Bauchi', code: 'BA' },
    { name: 'Borno', code: 'BO' },
    { name: 'Gombe', code: 'GM' },
    { name: 'Taraba', code: 'TA' },
    { name: 'Yobe', code: 'YB' },
  ],
  'NW': [
    { name: 'Jigawa', code: 'JG' },
    { name: 'Kaduna', code: 'KD' },
    { name: 'Kano', code: 'KN' },
    { name: 'Katsina', code: 'KT' },
    { name: 'Kebbi', code: 'KB' },
    { name: 'Sokoto', code: 'SK' },
    { name: 'Zamfara', code: 'ZM' },
  ],
  'SE': [
    { name: 'Abia', code: 'AB' },
    { name: 'Anambra', code: 'AN' },
    { name: 'Ebonyi', code: 'EB' },
    { name: 'Enugu', code: 'EN' },
    { name: 'Imo', code: 'IM' },
  ],
  'SS': [
    { name: 'Akwa Ibom', code: 'AK' },
    { name: 'Bayelsa', code: 'BY' },
    { name: 'Cross River', code: 'CR' },
    { name: 'Delta', code: 'DL' },
    { name: 'Edo', code: 'ED' },
    { name: 'Rivers', code: 'RV' },
  ],
  'SW': [
    { name: 'Ekiti', code: 'EK' },
    { name: 'Lagos', code: 'LA' },
    { name: 'Ogun', code: 'OG' },
    { name: 'Ondo', code: 'ON' },
    { name: 'Osun', code: 'OS' },
    { name: 'Oyo', code: 'OY' },
  ],
};

// Sample LGAs for some states (representative set)
const SAMPLE_LGAS: Record<string, string[]> = {
  'LA': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
  'FC': ['Abaji', 'Abuja Municipal', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
  'KN': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
  'RV': ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio-Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
  'EN': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo-Uwani'],
  'OY': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'],
  'KD': ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
};

// Sample wards (2-3 per sample LGA)
const SAMPLE_WARDS: Record<string, string[]> = {
  'Ikeja': ['Alausa', 'Anifowose', 'Ojodu'],
  'Surulere': ['Aguda', 'Coker', 'Itire'],
  'Eti-Osa': ['Ikoyi', 'Victoria Island', 'Lekki'],
  'Abuja Municipal': ['Garki', 'Wuse', 'Maitama', 'Asokoro'],
  'Port Harcourt': ['Diobu I', 'Diobu II', 'Old Township', 'New Layout'],
  'Ibadan North': ['Agodi Gate', 'Bodija', 'Sango'],
  'Kaduna North': ['Badarawa', 'Kawo', 'Kabala West'],
  'Kano Municipal': ['Fagge', 'Nassarawa', 'Gwagwarwa'],
  'Enugu North': ['Ogui', 'GRA', 'Asata'],
};

// Sample polling units (1-2 per ward)
const SAMPLE_POLLING_UNITS: Record<string, { name: string; code: string; lat?: number; lng?: number }[]> = {
  'Alausa': [
    { name: 'Alausa Primary School', code: 'LA/IKJ/ALA/001', lat: 6.6305, lng: 3.3550 },
    { name: 'Alausa Community Hall', code: 'LA/IKJ/ALA/002', lat: 6.6310, lng: 3.3560 },
  ],
  'Victoria Island': [
    { name: 'VI Community Centre', code: 'LA/ETO/VIC/001', lat: 6.4281, lng: 3.4219 },
  ],
  'Garki': [
    { name: 'Garki Model Primary School', code: 'FC/ABJ/GAR/001', lat: 9.0580, lng: 7.4891 },
    { name: 'Area 1 Community Hall', code: 'FC/ABJ/GAR/002', lat: 9.0520, lng: 7.4950 },
  ],
  'Port Harcourt': [
    { name: 'Town Hall PU', code: 'RV/PHC/PHC/001', lat: 4.8156, lng: 7.0498 },
  ],
  'Bodija': [
    { name: 'Bodija Market PU', code: 'OY/IBN/BOD/001', lat: 7.4140, lng: 3.9050 },
  ],
};

// Test users for each role
const TEST_USERS = [
  { fullName: 'Asabe Baba Nahaya', email: 'admin@nahayafoundation.org', phone: '+2347030215337', role: 'NATIONAL_ADMIN' as UserRole },
  { fullName: 'Regional Coordinator NC', email: 'regional.nc@nahayafoundation.org', phone: '+2348010000002', role: 'ZONAL_COORDINATOR' as UserRole, zoneCode: 'NC' },
  { fullName: 'State Coordinator FCT', email: 'state.fct@nahayafoundation.org', phone: '+2348010000003', role: 'STATE_COORDINATOR' as UserRole, stateCode: 'FC' },
  { fullName: 'Community Leader AMAC', email: 'community.amac@nahayafoundation.org', phone: '+2348010000004', role: 'LGA_COORDINATOR' as UserRole, stateCode: 'FC', lgaName: 'Abuja Municipal' },
  { fullName: 'Field Officer Wuse', email: 'field.wuse@nahayafoundation.org', phone: '+2348010000005', role: 'WARD_LEADER' as UserRole, stateCode: 'FC', lgaName: 'Abuja Municipal', wardName: 'Wuse' },
  { fullName: 'Outreach Agent Wuse', email: 'outreach.wuse@nahayafoundation.org', phone: '+2348010000006', role: 'POLLING_AGENT' as UserRole, stateCode: 'FC', lgaName: 'Abuja Municipal', wardName: 'Wuse' },
  { fullName: 'Volunteer FCT', email: 'volunteer@nahayafoundation.org', phone: '+2348010000007', role: 'VOLUNTEER' as UserRole, stateCode: 'FC' },
  { fullName: 'Supporter FCT', email: 'supporter@nahayafoundation.org', phone: '+2348010000008', role: 'MEMBER' as UserRole, stateCode: 'FC' },
];

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ─── Clear existing data ────────────────────────
  console.log('🗑️  Clearing existing data...');
  const tables = [
    'gOTVAssignment', 'surveyResponse', 'survey', 'userBadge', 'badge',
    'volunteerTask', 'incidentReport', 'donation', 'notification', 'auditLog',
    'mediaLibrary', 'activityUpload', 'eventAttendee', 'event', 'task',
    'messageRecipient', 'message', 'messageThread', 'user', 'pollingUnit',
    'ward', 'lga', 'state', 'zone',
  ];
  for (const table of tables) {
    try {
      await (prisma as any)[table].deleteMany();
    } catch (e: any) {
      console.log(`   ⚠️ Skipped clearing ${table}: ${e.message?.slice(0, 60)}`);
    }
  }

  // ─── Create Zones ──────────────────────────────
  console.log('🌍 Creating zones...');
  const zoneMap: Record<string, string> = {};
  for (const zone of ZONES) {
    const created = await prisma.zone.create({ data: zone });
    zoneMap[zone.code] = created.id;
  }
  console.log(`   ✅ ${ZONES.length} zones created`);

  // ─── Create States ─────────────────────────────
  console.log('🏛️  Creating states...');
  const stateMap: Record<string, string> = {};
  let stateCount = 0;
  for (const [zoneCode, states] of Object.entries(STATES_BY_ZONE)) {
    for (const state of states) {
      const created = await prisma.state.create({
        data: { ...state, zoneId: zoneMap[zoneCode] },
      });
      stateMap[state.code] = created.id;
      stateCount++;
    }
  }
  console.log(`   ✅ ${stateCount} states created (36 + FCT)`);

  // ─── Create LGAs ──────────────────────────────
  console.log('🏘️  Creating LGAs...');
  const lgaMap: Record<string, string> = {};
  let lgaCount = 0;
  for (const [stateCode, lgas] of Object.entries(SAMPLE_LGAS)) {
    for (const lgaName of lgas) {
      const created = await prisma.lga.create({
        data: { name: lgaName, stateId: stateMap[stateCode] },
      });
      lgaMap[lgaName] = created.id;
      lgaCount++;
    }
  }
  console.log(`   ✅ ${lgaCount} LGAs created`);

  // ─── Create Wards ─────────────────────────────
  console.log('🏡 Creating wards...');
  const wardMap: Record<string, string> = {};
  let wardCount = 0;
  for (const [lgaName, wards] of Object.entries(SAMPLE_WARDS)) {
    if (!lgaMap[lgaName]) continue;
    for (const wardName of wards) {
      const created = await prisma.ward.create({
        data: { name: wardName, lgaId: lgaMap[lgaName] },
      });
      wardMap[wardName] = created.id;
      wardCount++;
    }
  }
  console.log(`   ✅ ${wardCount} wards created`);

  // ─── Create Polling Units ─────────────────────
  console.log('🗳️  Creating polling units...');
  let puCount = 0;
  for (const [wardName, units] of Object.entries(SAMPLE_POLLING_UNITS)) {
    if (!wardMap[wardName]) continue;
    for (const unit of units) {
      await prisma.pollingUnit.create({
        data: {
          name: unit.name,
          code: unit.code,
          wardId: wardMap[wardName],
          latitude: unit.lat,
          longitude: unit.lng,
        },
      });
      puCount++;
    }
  }
  console.log(`   ✅ ${puCount} polling units created`);

  // ─── Create Badges ────────────────────────────
  console.log('🏅 Creating badges...');
  const badges = [
    { name: 'Welcome Aboard', description: 'Registered on the platform', badgeType: 'ONBOARDING', pointsRequired: 0 },
    { name: 'Community Builder', description: 'Recruited 10+ volunteers', badgeType: 'RECRUITMENT', pointsRequired: 200 },
    { name: 'Team Leader', description: 'Managed 5+ successful programs', badgeType: 'LEADERSHIP', pointsRequired: 100 },
    { name: 'Outreach Champion', description: 'Attended 10+ outreach events', badgeType: 'EVENTS', pointsRequired: 150 },
    { name: 'Impact Maker', description: 'Helped 50+ beneficiaries', badgeType: 'PVC', pointsRequired: 250 },
    { name: 'First Responder', description: 'First to respond to announcements', badgeType: 'COMMUNICATION', pointsRequired: 50 },
    { name: 'Awareness Star', description: 'Completed 20+ awareness campaigns', badgeType: 'SOCIAL_MEDIA', pointsRequired: 100 },
    { name: 'Field Hero', description: 'Completed 50+ field visits', badgeType: 'FIELD_WORK', pointsRequired: 300 },
  ];
  for (const badge of badges) {
    await prisma.badge.create({ data: badge });
  }
  console.log(`   ✅ ${badges.length} badges created`);

  // ─── Create Test Users ────────────────────────
  console.log('👤 Creating test users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Get reference IDs for NC zone and FCT
  const ncZoneId = zoneMap['NC'];
  const fctStateId = stateMap['FC'];
  const amacLgaId = lgaMap['Abuja Municipal'];
  const wuseWardId = wardMap['Wuse'];

  for (const testUser of TEST_USERS) {
    const userData: any = {
      fullName: testUser.fullName,
      email: testUser.email,
      phone: testUser.phone,
      passwordHash,
      role: testUser.role,
      status: 'ACTIVE',
      consentGiven: true,
      gender: 'MALE',
    };

    // Assign jurisdiction based on role
    switch (testUser.role) {
      case 'NATIONAL_ADMIN':
        break;
      case 'ZONAL_COORDINATOR':
        userData.zoneId = ncZoneId;
        break;
      case 'STATE_COORDINATOR':
        userData.zoneId = ncZoneId;
        userData.stateId = fctStateId;
        break;
      case 'LGA_COORDINATOR':
        userData.zoneId = ncZoneId;
        userData.stateId = fctStateId;
        userData.lgaId = amacLgaId;
        break;
      case 'WARD_LEADER':
      case 'POLLING_AGENT':
        userData.zoneId = ncZoneId;
        userData.stateId = fctStateId;
        userData.lgaId = amacLgaId;
        userData.wardId = wuseWardId;
        break;
      default:
        userData.zoneId = ncZoneId;
        userData.stateId = fctStateId;
        break;
    }

    await prisma.user.create({ data: userData });
  }
  console.log(`   ✅ ${TEST_USERS.length} test users created`);

  console.log('\n🎉 Seed complete!\n');
  console.log('─── Test Credentials ───');
  console.log('Password for all test users: Password123!');
  console.log('');
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.padEnd(22)} → ${u.email}`);
  }
  console.log('');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
