const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Unsplash image helper ───
const U = (id, w = 600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

// ─── 30 Locations with coordinates ───
const locations = [
  { loc: 'Malé, Maldives', lat: 4.1755, lng: 73.5093 },
  { loc: 'Ubud, Bali, Indonesia', lat: -8.5069, lng: 115.2625 },
  { loc: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { loc: 'Santorini, Greece', lat: 36.3932, lng: 25.4615 },
  { loc: 'Amalfi Coast, Italy', lat: 40.6340, lng: 14.6027 },
  { loc: 'Kyoto, Japan', lat: 35.0116, lng: 135.7681 },
  { loc: 'Interlaken, Switzerland', lat: 46.6863, lng: 7.8632 },
  { loc: 'Cancún, Mexico', lat: 21.1619, lng: -86.8515 },
  { loc: 'Phuket, Thailand', lat: 7.8804, lng: 98.3923 },
  { loc: 'Port Louis, Mauritius', lat: -20.1609, lng: 57.5012 },
  { loc: 'Mahé, Seychelles', lat: -4.6796, lng: 55.4920 },
  { loc: 'Nadi, Fiji', lat: -17.7765, lng: 177.9500 },
  { loc: 'Stone Town, Zanzibar', lat: -6.1659, lng: 39.1989 },
  { loc: 'Tulum, Mexico', lat: 20.2114, lng: -87.4654 },
  { loc: 'Marrakech, Morocco', lat: 31.6295, lng: -7.9811 },
  { loc: 'Göreme, Cappadocia, Turkey', lat: 38.6431, lng: 34.8287 },
  { loc: 'Maui, Hawaii, USA', lat: 20.7984, lng: -156.3319 },
  { loc: 'Queenstown, New Zealand', lat: -45.0312, lng: 168.6626 },
  { loc: 'El Calafate, Patagonia, Argentina', lat: -50.3400, lng: -72.2646 },
  { loc: 'Reykjavik, Iceland', lat: 64.1466, lng: -21.9426 },
  { loc: 'Lake Como, Italy', lat: 45.9937, lng: 9.2572 },
  { loc: 'Kotor, Montenegro', lat: 42.4247, lng: 18.7712 },
  { loc: 'Galle, Sri Lanka', lat: 6.0535, lng: 80.2210 },
  { loc: 'Bora Bora, French Polynesia', lat: -16.5004, lng: -151.7415 },
  { loc: 'Providenciales, Turks & Caicos', lat: 21.7735, lng: -72.1701 },
  { loc: 'Guanacaste, Costa Rica', lat: 10.6270, lng: -85.4437 },
  { loc: 'Vilankulo, Mozambique', lat: -22.0000, lng: 35.3167 },
  { loc: 'Muscat, Oman', lat: 23.5880, lng: 58.3829 },
  { loc: 'Hobart, Tasmania, Australia', lat: -42.8821, lng: 147.3272 },
  { loc: 'Ponta Delgada, Azores, Portugal', lat: 37.7483, lng: -25.6666 },
];

// ─── Resort templates per location (3-4 resorts each) ───
const resortTemplates = [
  // 1. Maldives (4)
  { name: 'Azure Lagoon Retreat', desc: 'Overwater bungalows with glass floors, private infinity pools, and direct lagoon access in the heart of the Maldives.', locIdx: 0, rating: 4.9, imgs: [U('1540541338287-41700207dee6'), U('1506929562872-bb421503ef21'), U('1544551763-46a013bb70d5')] },
  { name: 'Coral Sands Paradise', desc: 'Pristine white sand beaches, world-class snorkeling reefs, and sunset water villas with butler service.', locIdx: 0, rating: 4.8, imgs: [U('1573843981267-be1999161fd0'), U('1439130490301-25e322d88054'), U('1505881502353-a1986add3762')] },
  { name: 'Pearl Island Sanctuary', desc: 'Ultra-luxury island resort with underwater dining, private yacht excursions, and holistic spa treatments.', locIdx: 0, rating: 5.0, imgs: [U('1541480601022-2308c0f02487'), U('1507525428034-b723cf961d3e'), U('1510414842594-a61c69b5ae57')] },
  { name: 'Turquoise Bay Villas', desc: 'Secluded beachfront villas with plunge pools, open-air showers, and Maldivian-inspired architecture.', locIdx: 0, rating: 4.7, imgs: [U('1520250497591-112f2f40a3f4'), U('1571896349842-33c89424de2d'), U('1582719508461-905c673771fd')] },

  // 2. Bali (4)
  { name: 'Emerald Rice Terrace Lodge', desc: 'Nestled among Ubud\'s iconic rice paddies with panoramic jungle views, yoga pavilions, and organic farm-to-table dining.', locIdx: 1, rating: 4.8, imgs: [U('1537996194471-e657df975ab4'), U('1555854877-bab0e564b8d5'), U('1518684079-3c830dcef090')] },
  { name: 'Sacred Valley Hideaway', desc: 'Traditional Balinese compound with private pool villas, temple gardens, and artisan workshops.', locIdx: 1, rating: 4.6, imgs: [U('1570213489059-0aac6626c5b8'), U('1559599238-308793637427'), U('1540202404-a2f29016b523')] },
  { name: 'Bali Cliffside Infinity', desc: 'Dramatic clifftop resort overlooking the Indian Ocean with cantilevered infinity pool and spa caves.', locIdx: 1, rating: 4.9, imgs: [U('1571003123894-1f0652b2164c'), U('1566073771259-6a8506099945'), U('1551882547-ff40c63fe5fa')] },
  { name: 'Ubud Rainforest Retreat', desc: 'Eco-luxury treehouse suites with river valley views, meditation decks, and Balinese cooking classes.', locIdx: 1, rating: 4.5, imgs: [U('1596394516093-501ba68a0ba6'), U('1502672260266-1c1ef2d93688'), U('1600596542815-ffad4c1539a9')] },

  // 3. Dubai (3)
  { name: 'Golden Dune Palace', desc: 'Ultra-modern luxury resort with gold-accented interiors, rooftop desert lounge, and private beach club.', locIdx: 2, rating: 4.9, imgs: [U('1512453979798-5ea266f8880c'), U('1518684079-3c830dcef090'), U('1582719508461-905c673771fd')] },
  { name: 'Marina Heights Tower', desc: 'Skyline views from every suite, world-class dining on the 70th floor, and infinity pool overlooking the Palm.', locIdx: 2, rating: 4.7, imgs: [U('1496568816309-51d7c20e3b21'), U('1551882547-ff40c63fe5fa'), U('1540541338287-41700207dee6')] },
  { name: 'Desert Oasis Resort & Spa', desc: 'Arabian-themed oasis with desert safari experiences, falcon shows, and luxury Bedouin tents.', locIdx: 2, rating: 4.6, imgs: [U('1542314831-de8024d9116b'), U('1571896349842-33c89424de2d'), U('1519046904884-53103b34b206')] },

  // 4. Santorini (3)
  { name: 'Caldera Sunset Suites', desc: 'Cave-style suites carved into Santorini\'s caldera cliffs with private plunge pools and Aegean sunset views.', locIdx: 3, rating: 4.9, imgs: [U('1570077188670-e3a8d69ac5ff'), U('1533104816931-9cdfa1a5db68'), U('1571003123894-1f0652b2164c')] },
  { name: 'Blue Dome Boutique Hotel', desc: 'Iconic blue-domed architecture, whitewashed terraces, and Mediterranean cuisine with local wine pairings.', locIdx: 3, rating: 4.8, imgs: [U('1504512485720-7d83a16ee930'), U('1520250497591-112f2f40a3f4'), U('1515488764276-beade0c352a6')] },
  { name: 'Oia Cliffside Retreat', desc: 'Perched on Oia\'s volcanic cliffs with infinity pool, wine cave, and stargazing terrace.', locIdx: 3, rating: 4.7, imgs: [U('1548256847-77bbe72a5fc7'), U('1551882547-ff40c63fe5fa'), U('1573843981267-be1999161fd0')] },

  // 5. Amalfi Coast (3)
  { name: 'Positano Cliff Garden Hotel', desc: 'Terraced gardens cascading down to the sea, Michelin-starred restaurant, and private boat excursions.', locIdx: 4, rating: 4.8, imgs: [U('1516483638261-f4dbaf036963'), U('1515488764276-beade0c352a6'), U('1600596542815-ffad4c1539a9')] },
  { name: 'Amalfi Lemon Grove Resort', desc: 'Fragrant lemon groves surround this boutique resort with infinity pool and coastal hiking trails.', locIdx: 4, rating: 4.6, imgs: [U('1506744038136-46273834b3fb'), U('1570077188670-e3a8d69ac5ff'), U('1571003123894-1f0652b2164c')] },
  { name: 'Ravello Panorama Palace', desc: 'Historic villa turned luxury hotel with concert terrace, Roman bath spa, and panoramic coastal views.', locIdx: 4, rating: 4.9, imgs: [U('1544551763-46a013bb70d5'), U('1537996194471-e657df975ab4'), U('1582719508461-905c673771fd')] },

  // 6. Kyoto (3)
  { name: 'Zen Garden Ryokan', desc: 'Traditional Japanese inn with tatami suites, private onsen baths, and views of ancient bamboo forests.', locIdx: 5, rating: 4.8, imgs: [U('1540959733332-eab4deabeeaf'), U('1528164344705-47542687000d'), U('1493976040374-85c8e12f0c0e')] },
  { name: 'Sakura Temple Lodge', desc: 'Cherry blossom-surrounded retreat with tea ceremony rooms, Zen meditation gardens, and kaiseki dining.', locIdx: 5, rating: 4.7, imgs: [U('1493997181344-712f2f19d87a'), U('1540959733332-eab4deabeeaf'), U('1570213489059-0aac6626c5b8')] },
  { name: 'Arashiyama Bamboo Hotel', desc: 'Modern luxury meets Japanese tradition near the famous bamboo grove with river-view suites and geisha dinners.', locIdx: 5, rating: 4.5, imgs: [U('1528164344705-47542687000d'), U('1566073771259-6a8506099945'), U('1596394516093-501ba68a0ba6')] },

  // 7. Switzerland (3)
  { name: 'Alpine Crystal Chalet', desc: 'Ski-in/ski-out luxury chalet with heated outdoor pool, fondue terrace, and Matterhorn panorama.', locIdx: 6, rating: 4.9, imgs: [U('1510798831971-661eb04b3739'), U('1506744038136-46273834b3fb'), U('1548256847-77bbe72a5fc7')] },
  { name: 'Jungfrau Summit Hotel', desc: 'At 3,454m altitude with glass-walled suites, ice palace spa, and alpine railway access.', locIdx: 6, rating: 4.8, imgs: [U('1506744038136-46273834b3fb'), U('1510798831971-661eb04b3739'), U('1520250497591-112f2f40a3f4')] },
  { name: 'Lakeside Swiss Manor', desc: 'Belle Époque elegance on the shores of Lake Thun with private dock, vintage boat tours, and chocolate atelier.', locIdx: 6, rating: 4.6, imgs: [U('1571896349842-33c89424de2d'), U('1551882547-ff40c63fe5fa'), U('1573843981267-be1999161fd0')] },

  // 8. Cancún (4)
  { name: 'Caribbean Jade Resort', desc: 'All-inclusive beachfront paradise with cenote pool, tequila bar, and Mayan-inspired spa rituals.', locIdx: 7, rating: 4.7, imgs: [U('1507525428034-b723cf961d3e'), U('1540541338287-41700207dee6'), U('1519046904884-53103b34b206')] },
  { name: 'Riviera Maya Grand', desc: 'Eco-luxury resort on the Riviera Maya with jungle suites, zip-line canopy tours, and underground river swim.', locIdx: 7, rating: 4.6, imgs: [U('1573843981267-be1999161fd0'), U('1571896349842-33c89424de2d'), U('1510414842594-a61c69b5ae57')] },
  { name: 'Isla Blanca Beach Club', desc: 'Private island-style resort with white sand infinity pool, DJ sunset sessions, and snorkeling reefs.', locIdx: 7, rating: 4.8, imgs: [U('1506929562872-bb421503ef21'), U('1505881502353-a1986add3762'), U('1544551763-46a013bb70d5')] },
  { name: 'Playa del Sol Boutique', desc: 'Intimate boutique hotel steps from the beach with rooftop plunge pool and taco tasting menu.', locIdx: 7, rating: 4.4, imgs: [U('1520250497591-112f2f40a3f4'), U('1582719508461-905c673771fd'), U('1539037116277-4db20889f2d4')] },

  // 9. Phuket (4)
  { name: 'Andaman Pearl Resort', desc: 'Five-star Andaman Sea resort with private beach coves, Thai boxing ring, and floating breakfast service.', locIdx: 8, rating: 4.8, imgs: [U('1537996194471-e657df975ab4'), U('1540541338287-41700207dee6'), U('1571003123894-1f0652b2164c')] },
  { name: 'Kata Sunset Villas', desc: 'Hillside villas overlooking Kata Beach with private pools, Muay Thai lessons, and night market tours.', locIdx: 8, rating: 4.5, imgs: [U('1559599238-308793637427'), U('1566073771259-6a8506099945'), U('1596394516093-501ba68a0ba6')] },
  { name: 'Rawai Zen Wellness', desc: 'Health-focused retreat with detox programs, yoga shalas, plant-based cuisine, and Thai massage school.', locIdx: 8, rating: 4.6, imgs: [U('1570213489059-0aac6626c5b8'), U('1551882547-ff40c63fe5fa'), U('1502672260266-1c1ef2d93688')] },
  { name: 'Patong Bay Towers', desc: 'High-rise luxury with rooftop pool bar, Patong nightlife access, and panoramic Andaman views.', locIdx: 8, rating: 4.3, imgs: [U('1496568816309-51d7c20e3b21'), U('1518684079-3c830dcef090'), U('1519046904884-53103b34b206')] },

  // 10. Mauritius (3)
  { name: 'Le Morne Lagoon Resort', desc: 'UNESCO World Heritage beachfront with kite surfing, dolphin encounters, and Creole plantation dining.', locIdx: 9, rating: 4.8, imgs: [U('1544551763-46a013bb70d5'), U('1507525428034-b723cf961d3e'), U('1540541338287-41700207dee6')] },
  { name: 'Grand Baie Marina Hotel', desc: 'Yacht marina resort with deep-sea fishing, catamaran cruises, and colonial-style suites.', locIdx: 9, rating: 4.6, imgs: [U('1571896349842-33c89424de2d'), U('1573843981267-be1999161fd0'), U('1510414842594-a61c69b5ae57')] },
  { name: 'Chamarel Forest Lodge', desc: 'Eco-lodge near the Seven Colored Earth with rum distillery tours, waterfall hikes, and canopy dining.', locIdx: 9, rating: 4.5, imgs: [U('1506744038136-46273834b3fb'), U('1510798831971-661eb04b3739'), U('1596394516093-501ba68a0ba6')] },

  // 11. Seychelles (3)
  { name: 'Praslin Granite Cove', desc: 'Giant granite boulder-framed beach with nature reserve access, giant tortoise encounters, and diving schools.', locIdx: 10, rating: 4.9, imgs: [U('1506929562872-bb421503ef21'), U('1541480601022-2308c0f02487'), U('1439130490301-25e322d88054')] },
  { name: 'La Digue Barefoot Lodge', desc: 'Car-free island paradise with ox-cart transfers, Anse Source d\'Argent beach, and hammock suites.', locIdx: 10, rating: 4.7, imgs: [U('1505881502353-a1986add3762'), U('1510414842594-a61c69b5ae57'), U('1519046904884-53103b34b206')] },
  { name: 'Eden Island Yacht Club', desc: 'Marina-front residences with private mooring, infinity pool, and island-hopping helicopter tours.', locIdx: 10, rating: 4.6, imgs: [U('1520250497591-112f2f40a3f4'), U('1582719508461-905c673771fd'), U('1551882547-ff40c63fe5fa')] },

  // 12. Fiji (3)
  { name: 'Coral Coast Sanctuary', desc: 'Traditional bure-style villas on a private reef with fire dancing shows and kava ceremony welcome.', locIdx: 11, rating: 4.7, imgs: [U('1540541338287-41700207dee6'), U('1507525428034-b723cf961d3e'), U('1573843981267-be1999161fd0')] },
  { name: 'Mamanuca Island Retreat', desc: 'Private island resort with glass-bottom kayaks, manta ray feeding, and starlit beach dinners.', locIdx: 11, rating: 4.8, imgs: [U('1544551763-46a013bb70d5'), U('1506929562872-bb421503ef21'), U('1571896349842-33c89424de2d')] },
  { name: 'Savusavu Hot Springs Hotel', desc: 'Geothermally heated pools, pearl farm tours, and rainforest canopy walks on Fiji\'s hidden gem island.', locIdx: 11, rating: 4.5, imgs: [U('1537996194471-e657df975ab4'), U('1510798831971-661eb04b3739'), U('1596394516093-501ba68a0ba6')] },

  // 13. Zanzibar (3)
  { name: 'Spice Island Palace', desc: 'Stone Town heritage hotel with rooftop spice bar, dhow sailing excursions, and Swahili cooking classes.', locIdx: 12, rating: 4.6, imgs: [U('1519046904884-53103b34b206'), U('1542314831-de8024d9116b'), U('1570077188670-e3a8d69ac5ff')] },
  { name: 'Nungwi Beach Paradise', desc: 'Turquoise waters, bioluminescent night swims, local fishing village tours, and beachside massage huts.', locIdx: 12, rating: 4.7, imgs: [U('1507525428034-b723cf961d3e'), U('1540541338287-41700207dee6'), U('1505881502353-a1986add3762')] },
  { name: 'Pemba Island Eco-Lodge', desc: 'Secluded treehouse lodges with pristine coral reefs, mangrove kayaking, and sustainable seafood dining.', locIdx: 12, rating: 4.5, imgs: [U('1571003123894-1f0652b2164c'), U('1559599238-308793637427'), U('1506744038136-46273834b3fb')] },

  // 14. Tulum (3)
  { name: 'Cenote Jungle Resort', desc: 'Jungle retreat with private cenote swimming, Mayan ruin tours, and boho-chic treehouse suites.', locIdx: 13, rating: 4.7, imgs: [U('1570213489059-0aac6626c5b8'), U('1537996194471-e657df975ab4'), U('1566073771259-6a8506099945')] },
  { name: 'Tulum Beachfront Bohemia', desc: 'Barefoot luxury on Tulum Beach with mezcal tastings, sound healing sessions, and cacao ceremonies.', locIdx: 13, rating: 4.6, imgs: [U('1510414842594-a61c69b5ae57'), U('1520250497591-112f2f40a3f4'), U('1540541338287-41700207dee6')] },
  { name: 'Sian Ka\'an Biosphere Hotel', desc: 'UNESCO biosphere reserve gateway with wildlife safaris, fly-fishing, and stargazing platforms.', locIdx: 13, rating: 4.8, imgs: [U('1506929562872-bb421503ef21'), U('1571896349842-33c89424de2d'), U('1551882547-ff40c63fe5fa')] },

  // 15. Marrakech (3)
  { name: 'Riad Jardin Secret', desc: 'Traditional riad with mosaic courtyards, rooftop terrace, hammam spa, and Atlas Mountain day trips.', locIdx: 14, rating: 4.7, imgs: [U('1542314831-de8024d9116b'), U('1519046904884-53103b34b206'), U('1548256847-77bbe72a5fc7')] },
  { name: 'Palmeraie Desert Lodge', desc: 'Palatial lodge in the palm groves with camel rides, sand dune excursions, and Berber tent glamping.', locIdx: 14, rating: 4.6, imgs: [U('1496568816309-51d7c20e3b21'), U('1570077188670-e3a8d69ac5ff'), U('1573843981267-be1999161fd0')] },
  { name: 'Medina Boutique Palace', desc: 'Restored 19th-century palace in the medina with lantern-lit dining, souk shopping guides, and henna artists.', locIdx: 14, rating: 4.5, imgs: [U('1518684079-3c830dcef090'), U('1502672260266-1c1ef2d93688'), U('1596394516093-501ba68a0ba6')] },

  // 16. Cappadocia (3)
  { name: 'Cave Suite Fairy Chimney', desc: 'Luxury cave hotel with hot air balloon launches from the terrace, wine cellar tours, and pottery workshops.', locIdx: 15, rating: 4.9, imgs: [U('1548256847-77bbe72a5fc7'), U('1570077188670-e3a8d69ac5ff'), U('1542314831-de8024d9116b')] },
  { name: 'Valley View Stone House', desc: 'Hand-carved stone suites overlooking Rose Valley with horseback riding and underground city explorations.', locIdx: 15, rating: 4.7, imgs: [U('1533104816931-9cdfa1a5db68'), U('1515488764276-beade0c352a6'), U('1504512485720-7d83a16ee930')] },
  { name: 'Göreme Balloon Hotel', desc: 'Wake up to hundreds of hot air balloons from your private terrace with Turkish breakfast spread daily.', locIdx: 15, rating: 4.8, imgs: [U('1519046904884-53103b34b206'), U('1496568816309-51d7c20e3b21'), U('1510798831971-661eb04b3739')] },

  // 17. Maui (3)
  { name: 'Hana Highway Hideaway', desc: 'Secluded tropical paradise on the Road to Hana with waterfall pools, bamboo forest hikes, and luau feasts.', locIdx: 16, rating: 4.7, imgs: [U('1540541338287-41700207dee6'), U('1506929562872-bb421503ef21'), U('1537996194471-e657df975ab4')] },
  { name: 'Wailea Golden Sands', desc: 'Beachfront luxury with championship golf, whale watching tours, and farm-to-fork Hawaiian cuisine.', locIdx: 16, rating: 4.8, imgs: [U('1507525428034-b723cf961d3e'), U('1571896349842-33c89424de2d'), U('1582719508461-905c673771fd')] },
  { name: 'Ka\'anapali Surf Lodge', desc: 'Surf culture meets luxury with board rentals, cliff diving at Black Rock, and sunset sail cruises.', locIdx: 16, rating: 4.5, imgs: [U('1505881502353-a1986add3762'), U('1510414842594-a61c69b5ae57'), U('1544551763-46a013bb70d5')] },

  // 18. Queenstown NZ (3)
  { name: 'Lake Wakatipu Manor', desc: 'Lakefront estate with mountain views, bungee jumping packages, and Milford Sound helicopter tours.', locIdx: 17, rating: 4.8, imgs: [U('1506744038136-46273834b3fb'), U('1510798831971-661eb04b3739'), U('1551882547-ff40c63fe5fa')] },
  { name: 'Remarkables Ski Chalet', desc: 'Slope-side luxury with private hot tubs, après-ski wine bar, and guided glacier hikes.', locIdx: 17, rating: 4.7, imgs: [U('1548256847-77bbe72a5fc7'), U('1573843981267-be1999161fd0'), U('1596394516093-501ba68a0ba6')] },
  { name: 'Arrowtown Heritage Inn', desc: 'Gold rush-era charm with modern comforts, vineyard wine tours, and jet boat river adventures.', locIdx: 17, rating: 4.5, imgs: [U('1570077188670-e3a8d69ac5ff'), U('1520250497591-112f2f40a3f4'), U('1571003123894-1f0652b2164c')] },

  // 19. Patagonia (3)
  { name: 'Torres del Paine Lodge', desc: 'Adventure lodge with glacier trekking, puma tracking, and Patagonian lamb asado under the stars.', locIdx: 18, rating: 4.9, imgs: [U('1506744038136-46273834b3fb'), U('1510798831971-661eb04b3739'), U('1548256847-77bbe72a5fc7')] },
  { name: 'Perito Moreno Glacier Hotel', desc: 'Front-row glacier views with ice hiking, kayaking among icebergs, and gaucho estancia day trips.', locIdx: 18, rating: 4.7, imgs: [U('1551882547-ff40c63fe5fa'), U('1596394516093-501ba68a0ba6'), U('1573843981267-be1999161fd0')] },
  { name: 'Tierra del Fuego Cabin', desc: 'End-of-the-world cabin retreat with penguin colony visits, Beagle Channel cruises, and king crab feasts.', locIdx: 18, rating: 4.6, imgs: [U('1570077188670-e3a8d69ac5ff'), U('1533104816931-9cdfa1a5db68'), U('1519046904884-53103b34b206')] },

  // 20. Iceland (3)
  { name: 'Northern Lights Glass Lodge', desc: 'Glass-ceiling cabins for aurora viewing with geothermal hot springs, ice cave tours, and Viking feasts.', locIdx: 19, rating: 4.9, imgs: [U('1510798831971-661eb04b3739'), U('1506744038136-46273834b3fb'), U('1548256847-77bbe72a5fc7')] },
  { name: 'Blue Lagoon Luxury Retreat', desc: 'Adjacent to the famous Blue Lagoon with in-water bar, lava spa treatments, and midnight sun terrace.', locIdx: 19, rating: 4.8, imgs: [U('1551882547-ff40c63fe5fa'), U('1571003123894-1f0652b2164c'), U('1573843981267-be1999161fd0')] },
  { name: 'Vatnajökull Glacier Camp', desc: 'Luxury glamping near Europe\'s largest glacier with snowmobile rides, whale watching, and puffin walks.', locIdx: 19, rating: 4.6, imgs: [U('1596394516093-501ba68a0ba6'), U('1570077188670-e3a8d69ac5ff'), U('1510798831971-661eb04b3739')] },

  // 21. Lake Como (3)
  { name: 'Villa Bellagio Grandé', desc: 'Historic lakefront villa with manicured gardens, private boat pier, and truffle hunting in nearby forests.', locIdx: 20, rating: 4.9, imgs: [U('1516483638261-f4dbaf036963'), U('1515488764276-beade0c352a6'), U('1544551763-46a013bb70d5')] },
  { name: 'Varenna Terrace Hotel', desc: 'Terracotta-roofed beauty with lake-view dining, vintage Riva boat tours, and Italian cooking masterclasses.', locIdx: 20, rating: 4.7, imgs: [U('1506744038136-46273834b3fb'), U('1573843981267-be1999161fd0'), U('1571896349842-33c89424de2d')] },
  { name: 'Menaggio Lakeshore Spa', desc: 'Contemporary spa resort with hydrotherapy circuits, mountain biking trails, and Prosecco sunset cruises.', locIdx: 20, rating: 4.6, imgs: [U('1551882547-ff40c63fe5fa'), U('1582719508461-905c673771fd'), U('1520250497591-112f2f40a3f4')] },

  // 22. Montenegro (3)
  { name: 'Bay of Kotor Fortress', desc: 'Medieval fortress converted to luxury hotel with fjord-like bay views, old town tours, and Adriatic seafood.', locIdx: 21, rating: 4.7, imgs: [U('1570077188670-e3a8d69ac5ff'), U('1533104816931-9cdfa1a5db68'), U('1504512485720-7d83a16ee930')] },
  { name: 'Sveti Stefan Island', desc: 'Historic island resort connected by a narrow causeway with pebble beaches and Montenegrin wine cellars.', locIdx: 21, rating: 4.8, imgs: [U('1515488764276-beade0c352a6'), U('1548256847-77bbe72a5fc7'), U('1519046904884-53103b34b206')] },
  { name: 'Budva Riviera Resort', desc: 'Adriatic coastline resort with beach clubs, jet skiing, and old town nightlife access.', locIdx: 21, rating: 4.5, imgs: [U('1496568816309-51d7c20e3b21'), U('1542314831-de8024d9116b'), U('1518684079-3c830dcef090')] },

  // 23. Sri Lanka (4)
  { name: 'Galle Fort Heritage Hotel', desc: 'Colonial Dutch fort hotel with rampart walks, cricket ground views, and Sri Lankan curry cooking classes.', locIdx: 22, rating: 4.7, imgs: [U('1570213489059-0aac6626c5b8'), U('1559599238-308793637427'), U('1540202404-a2f29016b523')] },
  { name: 'Sigiriya Rock Lodge', desc: 'At the foot of the ancient rock fortress with elephant safaris, temple pilgrimages, and Ayurvedic retreats.', locIdx: 22, rating: 4.6, imgs: [U('1537996194471-e657df975ab4'), U('1570077188670-e3a8d69ac5ff'), U('1596394516093-501ba68a0ba6')] },
  { name: 'Mirissa Surf Camp Deluxe', desc: 'Beachfront surf lodge with whale watching, turtle hatchery visits, and moonlight beach BBQs.', locIdx: 22, rating: 4.5, imgs: [U('1507525428034-b723cf961d3e'), U('1506929562872-bb421503ef21'), U('1505881502353-a1986add3762')] },
  { name: 'Ella Mountain Railway Hotel', desc: 'Perched in tea country with iconic Nine Arches Bridge views, tea plantation tours, and misty morning yoga.', locIdx: 22, rating: 4.8, imgs: [U('1506744038136-46273834b3fb'), U('1510798831971-661eb04b3739'), U('1566073771259-6a8506099945')] },

  // 24. Bora Bora (3)
  { name: 'Mount Otemanu Overwater', desc: 'Iconic overwater bungalows facing Mount Otemanu with glass floor panels and private snorkeling reefs.', locIdx: 23, rating: 5.0, imgs: [U('1540541338287-41700207dee6'), U('1506929562872-bb421503ef21'), U('1541480601022-2308c0f02487')] },
  { name: 'Matira Beach Pearl Resort', desc: 'On the famous Matira Beach with pearl diving excursions, Polynesian dance shows, and outrigger canoe races.', locIdx: 23, rating: 4.9, imgs: [U('1544551763-46a013bb70d5'), U('1573843981267-be1999161fd0'), U('1507525428034-b723cf961d3e')] },
  { name: 'Lagoon Dream Villas', desc: 'Ultra-private lagoon villas with butler service, couples spa, and Polynesian tattoo artists on site.', locIdx: 23, rating: 4.8, imgs: [U('1510414842594-a61c69b5ae57'), U('1520250497591-112f2f40a3f4'), U('1571896349842-33c89424de2d')] },

  // 25. Turks & Caicos (3)
  { name: 'Grace Bay Grand', desc: 'Award-winning Grace Bay Beach with powder-white sand, world-class diving, and chef\'s table dining.', locIdx: 24, rating: 4.9, imgs: [U('1507525428034-b723cf961d3e'), U('1506929562872-bb421503ef21'), U('1582719508461-905c673771fd')] },
  { name: 'Chalk Sound Villa Resort', desc: 'Overlooking the stunning Chalk Sound lagoon with paddleboarding, conch salad tastings, and island tours.', locIdx: 24, rating: 4.7, imgs: [U('1505881502353-a1986add3762'), U('1540541338287-41700207dee6'), U('1571896349842-33c89424de2d')] },
  { name: 'Salt Cay Heritage House', desc: 'Historic salt merchant\'s house with humpback whale watching, pristine reefs, and Caribbean rum bar.', locIdx: 24, rating: 4.6, imgs: [U('1519046904884-53103b34b206'), U('1510414842594-a61c69b5ae57'), U('1551882547-ff40c63fe5fa')] },

  // 26. Costa Rica (4)
  { name: 'Arenal Volcano Lodge', desc: 'Volcano-view hot springs resort with canopy zip-lines, white water rafting, and howler monkey trails.', locIdx: 25, rating: 4.8, imgs: [U('1596394516093-501ba68a0ba6'), U('1570213489059-0aac6626c5b8'), U('1506744038136-46273834b3fb')] },
  { name: 'Manuel Antonio Treetops', desc: 'Treehouse-style suites in the national park with sloth watching, snorkeling, and sunset catamaran cruises.', locIdx: 25, rating: 4.7, imgs: [U('1537996194471-e657df975ab4'), U('1559599238-308793637427'), U('1566073771259-6a8506099945')] },
  { name: 'Nicoya Blue Zone Resort', desc: 'Wellness resort in one of the world\'s Blue Zones with longevity programs, surf lessons, and organic farms.', locIdx: 25, rating: 4.6, imgs: [U('1570077188670-e3a8d69ac5ff'), U('1571003123894-1f0652b2164c'), U('1555854877-bab0e564b8d5')] },
  { name: 'Monteverde Cloud Forest Inn', desc: 'Misty cloud forest lodge with hanging bridges, bird watching, and coffee plantation tours.', locIdx: 25, rating: 4.5, imgs: [U('1502672260266-1c1ef2d93688'), U('1510798831971-661eb04b3739'), U('1573843981267-be1999161fd0')] },

  // 27. Mozambique (3)
  { name: 'Bazaruto Archipelago Lodge', desc: 'Remote island paradise with dugong sightings, dhow sailing, and Mozambican peri-peri seafood grills.', locIdx: 26, rating: 4.7, imgs: [U('1541480601022-2308c0f02487'), U('1507525428034-b723cf961d3e'), U('1439130490301-25e322d88054')] },
  { name: 'Tofo Beach Surf Resort', desc: 'Whale shark diving capital with surf breaks, beach bonfires, and freshly caught lobster dinners.', locIdx: 26, rating: 4.5, imgs: [U('1505881502353-a1986add3762'), U('1540541338287-41700207dee6'), U('1571896349842-33c89424de2d')] },
  { name: 'Quirimbas Castaway', desc: 'Castaway luxury on uninhabited islands with mangrove safaris, kayak expeditions, and bush dinners.', locIdx: 26, rating: 4.6, imgs: [U('1544551763-46a013bb70d5'), U('1519046904884-53103b34b206'), U('1510414842594-a61c69b5ae57')] },

  // 28. Oman (3)
  { name: 'Jabal Akhdar Cliff Resort', desc: 'Perched on the edge of a 2,000m canyon with desert stargazing, rose water distillery, and falaj walks.', locIdx: 27, rating: 4.8, imgs: [U('1542314831-de8024d9116b'), U('1496568816309-51d7c20e3b21'), U('1548256847-77bbe72a5fc7')] },
  { name: 'Musandam Fjord Lodge', desc: 'Norwegian-style fjords in Arabia with dhow cruises, dolphin watching, and mountain goat encounters.', locIdx: 27, rating: 4.7, imgs: [U('1518684079-3c830dcef090'), U('1570077188670-e3a8d69ac5ff'), U('1533104816931-9cdfa1a5db68')] },
  { name: 'Wahiba Sands Desert Camp', desc: 'Luxury Bedouin camp with dune bashing, sandboarding, and traditional Omani shuwa underground BBQ.', locIdx: 27, rating: 4.6, imgs: [U('1519046904884-53103b34b206'), U('1542314831-de8024d9116b'), U('1506744038136-46273834b3fb')] },

  // 29. Tasmania (3)
  { name: 'Cradle Mountain Wilderness', desc: 'Wilderness lodge with wombat encounters, overland track access, and Tasmania devil feeding tours.', locIdx: 28, rating: 4.7, imgs: [U('1510798831971-661eb04b3739'), U('1506744038136-46273834b3fb'), U('1596394516093-501ba68a0ba6')] },
  { name: 'Freycinet Coastal Pavilion', desc: 'Glass pavilion suites facing Wineglass Bay with oyster farm tours, sea kayaking, and bushwalking.', locIdx: 28, rating: 4.8, imgs: [U('1551882547-ff40c63fe5fa'), U('1573843981267-be1999161fd0'), U('1571003123894-1f0652b2164c')] },
  { name: 'Bruny Island Lighthouse Stay', desc: 'Heritage lighthouse accommodation with penguin tours, cheese trails, and Southern Ocean storm watching.', locIdx: 28, rating: 4.5, imgs: [U('1570077188670-e3a8d69ac5ff'), U('1520250497591-112f2f40a3f4'), U('1559599238-308793637427')] },

  // 30. Azores (3)
  { name: 'Sete Cidades Crater Hotel', desc: 'Inside a volcanic crater with twin lake views, hot spring bathing, and whale watching boat tours.', locIdx: 29, rating: 4.8, imgs: [U('1506744038136-46273834b3fb'), U('1510798831971-661eb04b3739'), U('1551882547-ff40c63fe5fa')] },
  { name: 'Furnas Thermal Spa Resort', desc: 'Geothermal valley resort with natural hot pools, volcanic-cooked cozido stew, and botanical garden tours.', locIdx: 29, rating: 4.6, imgs: [U('1596394516093-501ba68a0ba6'), U('1573843981267-be1999161fd0'), U('1571896349842-33c89424de2d')] },
  { name: 'Faial Marina Blue Hotel', desc: 'Atlantic marina hotel with sailing charters, scrimshaw art galleries, and Peter Café Sport gin and tonics.', locIdx: 29, rating: 4.5, imgs: [U('1570077188670-e3a8d69ac5ff'), U('1519046904884-53103b34b206'), U('1548256847-77bbe72a5fc7')] },
];

async function main() {
  console.log('🌍 Starting MEGA seed: 100+ resorts across 30 locations...\n');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const guestPassword = await bcrypt.hash('guest123', 10);

  // ── Clean existing data ──
  console.log('🧹 Cleaning existing data...');
  await prisma.roomAssignment.deleteMany();
  await prisma.reservationService.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.room.deleteMany();
  await prisma.resort.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.department.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.guest.deleteMany();

  // ── Departments ──
  console.log('🏢 Creating departments...');
  const adminDept = await prisma.department.create({ data: { name: 'Administration', managerName: 'Sarah Jenkins' } });
  const hkDept = await prisma.department.create({ data: { name: 'Housekeeping', managerName: 'Robert Dow' } });

  // ── Staff ──
  console.log('👤 Creating staff...');
  const adminUser = await prisma.staff.create({
    data: { fullName: 'Sarah Jenkins', email: 'admin@bookme.com', password: adminPassword, role: 'ADMIN', shift: 'Day', departmentId: adminDept.id },
  });
  const staffUser = await prisma.staff.create({
    data: { fullName: 'John Cleaner', email: 'staff@bookme.com', password: staffPassword, role: 'STAFF', shift: 'Day', departmentId: hkDept.id },
  });

  // ── Guest ──
  console.log('🧑 Creating guest...');
  await prisma.guest.create({
    data: { fullName: 'Faisal Dev', email: 'guest@gmail.com', password: guestPassword, idProofNum: 'ID-99281-US', phone: '+1 555 12345', nationality: 'American' },
  });

  // ── Room Types ──
  console.log('🛏️ Creating room types...');
  const deluxeType = await prisma.roomType.create({
    data: { name: 'Deluxe Suite', description: 'Elegant room with king-size bed, private balcony, marble bathroom.', basePrice: 250.00, maxOccupency: 2 },
  });
  const oceanType = await prisma.roomType.create({
    data: { name: 'Oceanfront Villa', description: 'Stunning ocean views, outdoor private infinity pool, fully equipped kitchen.', basePrice: 450.00, maxOccupency: 3 },
  });
  const presidentialType = await prisma.roomType.create({
    data: { name: 'Presidential Suite', description: 'Multi-room layout, panoramic glass windows, 24/7 private butler, jacuzzi terrace.', basePrice: 850.00, maxOccupency: 4 },
  });
  const roomTypes = [deluxeType, oceanType, presidentialType];

  // ── Services ──
  console.log('🧖 Creating services...');
  await prisma.service.create({ data: { name: 'Luxury Spa Massage', category: 'Wellness', price: 120.00, staffId: staffUser.id } });
  await prisma.service.create({ data: { name: 'Gourmet In-Room Dining', category: 'Dining', price: 85.00, staffId: staffUser.id } });
  await prisma.service.create({ data: { name: 'VIP Airport Shuttle', category: 'Transport', price: 50.00, staffId: adminUser.id } });

  // ── Create 100+ Resorts with Rooms ──
  console.log(`\n🏨 Creating ${resortTemplates.length} resorts with rooms...\n`);
  let roomCounter = 100;

  for (let i = 0; i < resortTemplates.length; i++) {
    const t = resortTemplates[i];
    const loc = locations[t.locIdx];

    const resort = await prisma.resort.create({
      data: {
        name: t.name,
        description: t.desc,
        location: loc.loc,
        latitude: loc.lat + (Math.random() - 0.5) * 0.05,
        longitude: loc.lng + (Math.random() - 0.5) * 0.05,
        images: t.imgs,
        rating: t.rating,
      },
    });

    // Create 2-4 rooms per resort
    const numRooms = 2 + Math.floor(Math.random() * 3); // 2-4
    for (let r = 0; r < numRooms; r++) {
      roomCounter++;
      const floor = String(Math.floor(r / 2) + 1);
      const roomType = roomTypes[r % roomTypes.length];
      await prisma.room.create({
        data: {
          resortId: resort.id,
          roomTypeId: roomType.id,
          roomNum: `R${roomCounter}`,
          floor,
          status: 'AVAILABLE',
        },
      });
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ ${i + 1}/${resortTemplates.length} resorts created`);
    }
  }

  console.log(`\n✅ Seed complete! Created ${resortTemplates.length} resorts across ${locations.length} locations.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
