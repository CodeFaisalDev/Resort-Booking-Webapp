const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleReviewers = [
  { name: 'Eleanor Vance', email: 'eleanor.vance@example.com', nationality: 'United Kingdom' },
  { name: 'Marcus Sterling', email: 'marcus.sterling@example.com', nationality: 'United States' },
  { name: 'Sophia Chen', email: 'sophia.chen@example.com', nationality: 'Singapore' },
  { name: 'Julian Beaufort', email: 'julian.b@example.com', nationality: 'France' },
  { name: 'Aria Takahashi', email: 'aria.t@example.com', nationality: 'Japan' },
  { name: 'David Miller', email: 'david.m@example.com', nationality: 'Canada' },
  { name: 'Elena Rostova', email: 'elena.r@example.com', nationality: 'Switzerland' }
];

const luxuryReviewTemplates = [
  {
    rating: 5,
    title: 'An Absolute Paradise of Serenity and Elegance',
    comment: 'From the moment we arrived, the level of personalized service was extraordinary. The ocean-view villa offered breathtaking panoramic sunsets, and the private infinity pool was cleaned daily. The staff anticipated our every request before we even asked. Unforgettable experience!'
  },
  {
    rating: 5,
    title: 'World-Class Hospitality & Exquisite Dining',
    comment: 'The resort exceeded all expectations. The spa treatment was rejuvenating, and the Michelin-caliber culinary offerings at the main restaurant were phenomenal. Watching the sunrise from our private balcony with fresh artisan coffee is a core memory now.'
  },
  {
    rating: 4,
    title: 'Stunning Location and Flawless Architecture',
    comment: 'Sensational design that seamlessly blends nature with modern luxury aesthetics. Room turnover housekeeping was immaculate. The concierge arranged an incredible sunset yacht tour. Highly recommended for couples looking for a romantic escape.'
  },
  {
    rating: 5,
    title: 'Pure Luxury & Tranquility',
    comment: 'The private butler service and attention to fine detail made our anniversary stay truly unforgettable. The plush bed linen, curated ambient lighting, and serene beach setup made it the best vacation of our lives.'
  },
  {
    rating: 5,
    title: 'A Masterpiece of Luxury Hospitality',
    comment: 'Exceptional in every single dimension! The architecture is awe-inspiring, the infinity pool overlooks pristine turquoise waters, and the wellness treatments left us completely refreshed. We are already planning our return next summer!'
  }
];

const richDescriptions = [
  `Nestled in a private sanctuary of unparalleled natural beauty, this retreat combines architectural mastery with world-class eco-luxury. Featuring private glass-bottom villas, Michelin-starred fine dining, a holistic wellness spa, and round-the-clock dedicated butler service. Every element is crafted to deliver total privacy, deep relaxation, and timeless memory creation for discerning global travelers.`,
  `Experience pinnacle luxury atop breathtaking coastal cliffs. Offering uninterrupted 360-degree ocean views, temperature-controlled private plunge pools, organic farm-to-table cuisine, and bespoke excursion arrangements. Whether unwinding in your plush marble bathroom or sipping hand-crafted cocktails at the cliffside sunset lounge, your stay promises pure enchantment.`,
  `An alpine sanctuary engineered for ultimate indulgence and peaceful solitude. Surrounded by majestic snow-capped peaks, this resort offers ski-in/ski-out privileges, thermal open-air hydrotherapy pools, wood-burning hearth suites, and a wine cellar featuring rare vintages. Perfect for winter escapes and summer mountain retreats alike.`
];

async function seedReviewsAndDescriptions() {
  console.log('--- Starting Resort Description & Review Seeding ---');

  // 1. Ensure sample guests exist for reviews
  const guests = [];
  for (const r of sampleReviewers) {
    const g = await prisma.guest.upsert({
      where: { email: r.email },
      update: {},
      create: {
        fullName: r.name,
        email: r.email,
        password: '$2a$10$e8w3bW3M/rXW8b7n2Y8m.eX7eY8m.eX7eY8m.eX7eY8m.eX7e', // dummy hash
        idProofNum: 'ID-' + Math.floor(100000 + Math.random() * 900000),
        phone: '+1 555-' + Math.floor(1000 + Math.random() * 9000),
        nationality: r.nationality,
        isVerified: true
      }
    });
    guests.push(g);
  }

  // 2. Fetch all resorts
  const resorts = await prisma.resort.findMany();
  console.log(`Found ${resorts.length} resorts to enrich...`);

  for (let i = 0; i < resorts.length; i++) {
    const resort = resorts[i];
    const desc = richDescriptions[i % richDescriptions.length];
    
    // Update description if generic
    await prisma.resort.update({
      where: { id: resort.id },
      data: {
        description: desc
      }
    });

    // Check if reviews already exist
    const existingCount = await prisma.review.count({ where: { resortId: resort.id } });
    if (existingCount === 0) {
      // Pick 3 random reviewers and create reviews
      const selectedReviewers = [...guests].sort(() => 0.5 - Math.random()).slice(0, 3);
      let totalRating = 0;

      for (let j = 0; j < selectedReviewers.length; j++) {
        const revTemplate = luxuryReviewTemplates[j % luxuryReviewTemplates.length];
        totalRating += revTemplate.rating;

        await prisma.review.create({
          data: {
            resortId: resort.id,
            guestId: selectedReviewers[j].id,
            rating: revTemplate.rating,
            title: revTemplate.title,
            comment: revTemplate.comment
          }
        });
      }

      // Update resort average rating
      const avg = Number((totalRating / selectedReviewers.length).toFixed(1));
      await prisma.resort.update({
        where: { id: resort.id },
        data: { rating: avg }
      });
    }
  }

  console.log('--- Completed Seeding Descriptions & Guest Reviews ---');
}

seedReviewsAndDescriptions()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
