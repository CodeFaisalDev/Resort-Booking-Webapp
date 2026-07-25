const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const regions = [
  { name: 'Maldives', lat: 3.2, lng: 73.0, type: 'beach' },
  { name: 'Swiss Alps', lat: 46.5, lng: 8.0, type: 'mountain' },
  { name: 'Amalfi Coast', lat: 40.6, lng: 14.5, type: 'beach' },
  { name: 'Bali', lat: -8.4, lng: 115.1, type: 'tropical' },
  { name: 'Santorini', lat: 36.4, lng: 25.4, type: 'coastal' },
  { name: 'Kyoto', lat: 35.0, lng: 135.7, type: 'forest' },
  { name: 'Hawaii', lat: 20.7, lng: -156.3, type: 'tropical' },
  { name: 'Aspen', lat: 39.1, lng: -106.8, type: 'mountain' },
  { name: 'Bahamas', lat: 25.0, lng: -77.3, type: 'beach' },
  { name: 'Fiji', lat: -17.7, lng: 178.0, type: 'tropical' }
];

const adjectives = [
  'Grand', 'Serene', 'Royal', 'Azure', 'Golden', 'Mystic', 'Crystal', 'Secret', 'Horizon', 
  'Vista', 'Breeze', 'Sands', 'Sanctuary', 'Oasis', 'Haven', 'Palace', 'Zen', 'Majestic', 
  'Emerald', 'Whispering', 'Tranquil', 'Sunset', 'Solitude', 'Starlight', 'Infinity'
];

const nouns = [
  'Resort', 'Villas', 'Retreat', 'Lodge', 'Sanctuary', 'Spa', 'Palace', 'Haven', 'Manor', 
  'Chalet', 'Bungalows', 'Suites', 'Gardens', 'Lagoon', 'Cove', 'Hideaway', 'Atoll', 
  'Chateau', 'Cliffs', 'Heights', 'Baye', 'Peak', 'Ridge', 'Castle', 'Estate'
];

const beachImages = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=600'
];

const mountainImages = [
  'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=600'
];

const forestImages = [
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1463406240611-1e3c4919d740?auto=format&fit=crop&q=80&w=600'
];

function getRandomImages(type) {
  if (type === 'mountain') return mountainImages;
  if (type === 'forest') return forestImages;
  return beachImages;
}

async function main() {
  console.log('Seeding 100 Resorts database...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const guestPassword = await bcrypt.hash('guest123', 10);

  // 1. Create Departments
  console.log('Creating departments...');
  const adminDept = await prisma.department.create({
    data: { name: 'Administration', managerName: 'Sarah Jenkins' }
  });
  const hkDept = await prisma.department.create({
    data: { name: 'Housekeeping', managerName: 'Robert Dow' }
  });

  // 2. Create Staff & Admin
  console.log('Creating staff & admin...');
  const adminUser = await prisma.staff.create({
    data: {
      fullName: 'Sarah Jenkins',
      email: 'admin@bookme.com',
      password: adminPassword,
      role: 'ADMIN',
      shift: 'Day',
      departmentId: adminDept.id
    }
  });
  const staffUser = await prisma.staff.create({
    data: {
      fullName: 'John Cleaner',
      email: 'staff@bookme.com',
      password: staffPassword,
      role: 'STAFF',
      shift: 'Day',
      departmentId: hkDept.id
    }
  });

  // 3. Create Default Guest
  console.log('Creating a default guest...');
  const defaultGuest = await prisma.guest.create({
    data: {
      fullName: 'Faisal Dev',
      email: 'guest@gmail.com',
      password: guestPassword,
      idProofNum: 'ID-99281-US',
      phone: '+1 555 12345',
      nationality: 'American'
    }
  });

  // 4. Create Room Types
  console.log('Creating room types...');
  const deluxeType = await prisma.roomType.create({
    data: {
      name: 'Deluxe Suite',
      description: 'An elegant room featuring a king-size bed, private balcony, marble bathroom, and standard smart amenities.',
      basePrice: 250.00,
      maxOccupency: 2
    }
  });
  const oceanType = await prisma.roomType.create({
    data: {
      name: 'Oceanfront Villa',
      description: 'Stunning direct ocean views, outdoor private infinity pool, fully equipped mini-kitchen, and personal sun loungers.',
      basePrice: 450.00,
      maxOccupency: 3
    }
  });
  const presidentialType = await prisma.roomType.create({
    data: {
      name: 'Presidential Suite',
      description: 'The pinnacle of luxury. Multi-room layout, panoramic floor-to-ceiling glass windows, 24/7 private butler access, and a premium jacuzzi terrace.',
      basePrice: 850.00,
      maxOccupency: 4
    }
  });

  // 5. Generate 100 Resorts
  console.log('Generating 100 resorts...');
  const resorts = [];
  let resortCount = 0;

  for (let i = 0; i < 100; i++) {
    const region = regions[i % regions.length];
    
    // Generate unique names
    const adj = adjectives[(i + 5) % adjectives.length];
    const noun = nouns[(i + 2) % nouns.length];
    const resortName = `${adj} ${noun} ${region.name}`;

    // Coordinates jitter
    const jitterLat = (Math.random() - 0.5) * 0.15;
    const jitterLng = (Math.random() - 0.5) * 0.15;
    const lat = region.lat + jitterLat;
    const lng = region.lng + jitterLng;

    const rating = parseFloat((4.3 + Math.random() * 0.7).toFixed(1));
    const images = getRandomImages(region.type);

    const resort = await prisma.resort.create({
      data: {
        name: resortName,
        description: `Experience pure luxury at ${resortName}. Nested in the premium locations of ${region.name}, this property features state-of-the-art accommodations, high-end private dining, and custom wellness services designed for your ultimate relaxation.`,
        location: `${region.name}, Coastal Sector ${i + 1}`,
        latitude: lat,
        longitude: lng,
        rating,
        images
      }
    });

    resorts.push(resort);
    resortCount++;

    // Create 3 rooms per resort (Deluxe, Oceanfront, Presidential)
    await prisma.room.create({
      data: {
        roomNum: `RM-${100 + i}-DLX`,
        floor: '1',
        roomTypeId: deluxeType.id,
        resortId: resort.id,
        status: 'AVAILABLE'
      }
    });

    await prisma.room.create({
      data: {
        roomNum: `RM-${200 + i}-OCN`,
        floor: '2',
        roomTypeId: oceanType.id,
        resortId: resort.id,
        status: 'AVAILABLE'
      }
    });

    await prisma.room.create({
      data: {
        roomNum: `RM-${300 + i}-PSD`,
        floor: '3',
        roomTypeId: presidentialType.id,
        resortId: resort.id,
        status: 'AVAILABLE'
      }
    });
  }

  console.log(`Successfully seeded ${resortCount} resorts and associated rooms.`);

  // 6. Create Services
  console.log('Creating services...');
  await prisma.service.create({
    data: {
      name: 'Luxury Spa Massage',
      category: 'Wellness',
      price: 120.00,
      staffId: staffUser.id
    }
  });
  await prisma.service.create({
    data: {
      name: 'Gourmet In-Room Dining',
      category: 'Dining',
      price: 85.00,
      staffId: staffUser.id
    }
  });
  await prisma.service.create({
    data: {
      name: 'VIP Airport Shuttle Transfer',
      category: 'Transport',
      price: 50.00,
      staffId: adminUser.id
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
