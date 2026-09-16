// ===== Shared listing data =====
// Shape mirrors the future Firestore `listings` collection exactly,
// so swapping this array for a live query later (Section 11) requires
// no changes to listings.js or listing-detail.js.
export const LISTINGS = [
  {
    id: '1',
    title: 'Riverside Two-Bedroom',
    price: 420000,
    location: 'Lekki Phase 1, Lagos',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1180,
    status: 'available',
    featured: true,
    description: 'A bright, riverside two-bedroom with an open-plan living area and floor-to-ceiling windows facing the water. Recently renovated kitchen, private balcony, and secure parking included.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop'
    ]
  },
  {
    id: '2',
    title: 'Skyline Studio',
    price: 180000,
    location: 'Victoria Island, Lagos',
    type: 'apartment',
    bedrooms: 0,
    bathrooms: 1,
    sqft: 540,
    status: 'available',
    featured: true,
    description: 'A compact, efficient studio in the heart of Victoria Island, ideal for a single professional. Building includes a gym, rooftop lounge, and 24-hour security.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1400&auto=format&fit=crop'
    ]
  },
  {
    id: '3',
    title: 'Garden Family Home',
    price: 610000,
    location: 'Ikoyi, Lagos',
    type: 'house',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    status: 'sold',
    featured: true,
    description: 'A spacious four-bedroom family home set behind private gates, with a mature garden, covered patio, and staff quarters. Quiet, tree-lined street close to international schools.',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1400&auto=format&fit=crop'
    ]
  },
  {
    id: '4',
    title: 'Palm Grove Loft',
    price: 265000,
    location: 'Yaba, Lagos',
    type: 'condo',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    status: 'available',
    featured: true,
    description: 'An airy one-bedroom loft with exposed wooden beams and polished concrete floors, in a converted warehouse building close to Yaba\'s tech corridor.',
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop'
    ]
  },
  {
    id: '5',
    title: 'Marina Heights Duplex',
    price: 780000,
    location: 'Victoria Island, Lagos',
    type: 'house',
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1950,
    status: 'available',
    featured: false,
    description: 'A modern duplex with sea views from the upper floor, private rooftop terrace, and dedicated parking for two vehicles. Move-in ready.',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1400&auto=format&fit=crop'
    ]
  },
  {
    id: '6',
    title: 'Ikoyi Courtyard Villa',
    price: 950000,
    location: 'Ikoyi, Lagos',
    type: 'house',
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3200,
    status: 'available',
    featured: false,
    description: 'A grand five-bedroom villa arranged around a private central courtyard, with staff quarters, a swimming pool, and mature landscaping throughout.',
    images: [
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop'
    ]
  },
  {
    id: '7',
    title: 'Yaba Corner Plot',
    price: 310000,
    location: 'Yaba, Lagos',
    type: 'land',
    bedrooms: 0,
    bathrooms: 0,
    sqft: 4000,
    status: 'available',
    featured: false,
    description: 'A cleared corner plot with registered title documents, ready for development. Water and electricity connections already run to the boundary.',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1400&auto=format&fit=crop'
    ]
  },
  {
    id: '8',
    title: 'Lekki Waterside Condo',
    price: 340000,
    location: 'Lekki Phase 1, Lagos',
    type: 'condo',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1050,
    status: 'available',
    featured: false,
    description: 'A two-bedroom condo overlooking the lagoon, with access to a shared pool, gym, and secure gated parking.',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop'
    ]
  }
];