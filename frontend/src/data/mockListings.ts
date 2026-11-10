export interface ListingImage {
  sourceRef: string;
  storageKey: string | null;
  alt: string;
  position: number;
}

export interface DetailedListing {
  slug: string;
  headline: string;
  status: string;
  listingType: "SALE" | "RENT";
  category: "HOUSE" | "APARTMENT" | "COMMERCIAL" | "INDUSTRIAL" | "LAND";
  addressLine: string;
  suburb: string;
  postcode: string;
  state: string;
  priceLabel: string;
  priceMin?: number;
  priceMax?: number;
  description: string;
  beds: number | null;
  baths: number | null;
  parking: number | null;
  landSqm: number | null;
  floorSqm: number | null;
  images: ListingImage[];
}

export const MOCK_LISTINGS: DetailedListing[] = [
  {
    slug: "the-victorian-residence-richmond",
    headline: "The Victorian Residence",
    status: "ACTIVE",
    listingType: "SALE",
    category: "HOUSE",
    addressLine: "42 Lennox Street",
    suburb: "Richmond",
    postcode: "3121",
    state: "VIC",
    priceLabel: "$2,450,000",
    priceMin: 2400000,
    priceMax: 2500000,
    description: "A meticulously restored double-fronted Victorian home positioned on one of Richmond's most coveted tree-lined avenues.\n\nFeaturing soaring 3.4m ceilings, polished European oak timber flooring, custom steel-framed glazed doors opening onto a tranquil north-facing courtyard, and a bespoke marble kitchen appointed with Gaggenau appliances.\n\nA master bedroom suite occupies its own private wing, complete with a skylit ensuite, walk-in robes, and views across the heritage chimney tops of inner Melbourne.",
    beds: 3,
    baths: 2,
    parking: 1,
    landSqm: 380,
    floorSqm: 210,
    images: [
      { sourceRef: "/images/victorian-residence.jpg", storageKey: null, alt: "Editorial facade of contemporary Victorian home", position: 0 },
      { sourceRef: "/images/architecture-detail.jpg", storageKey: null, alt: "Warm timber joinery and glazed openings", position: 1 },
      { sourceRef: "/images/interior-light.jpg", storageKey: null, alt: "Sun-drenched living area", position: 2 },
    ],
  },
  {
    slug: "southbank-riverfront-sanctuary",
    headline: "Southbank Riverfront Sanctuary",
    status: "ACTIVE",
    listingType: "RENT",
    category: "APARTMENT",
    addressLine: "88 Riverside Quay",
    suburb: "Southbank",
    postcode: "3006",
    state: "VIC",
    priceLabel: "$850 / week",
    priceMin: 800,
    priceMax: 900,
    description: "Perched high above the Yarra River with uninterrupted panoramic vistas of Melbourne's sparkling skyline and botanical gardens.\n\nCrafted with tactile terrazzo stone, minimalist acoustic paneling, and an expansive sheltered terrace that invites outdoor entertaining in all seasons.\n\nResidents enjoy private concierge services, a heated lap pool, state-of-the-art gymnasium, and direct proximity to Melbourne's vibrant Arts Precinct.",
    beds: 2,
    baths: 2,
    parking: 1,
    landSqm: null,
    floorSqm: 118,
    images: [
      { sourceRef: "/images/terrace.jpg", storageKey: null, alt: "Expansive leafy terrace and city outlook", position: 0 },
      { sourceRef: "/images/quiet-interior.jpg", storageKey: null, alt: "Soft morning light across the living space", position: 1 },
    ],
  },
  {
    slug: "clendon-road-estate-toorak",
    headline: "Clendon Road Architectural Estate",
    status: "ACTIVE",
    listingType: "SALE",
    category: "HOUSE",
    addressLine: "18 Clendon Road",
    suburb: "Toorak",
    postcode: "3142",
    state: "VIC",
    priceLabel: "$5,800,000",
    priceMin: 5500000,
    priceMax: 6000000,
    description: "An extraordinary private compound designed by leading Melbourne architects, nestled within secluded landscaped grounds in premier Toorak.\n\nDramatic double-height glass curtains connect calm travertine interiors with an azure infinity pool and mature olive grove.\n\nComprising four spacious bedroom suites, an expansive wine cellar, home cinema, and secure subterranean parking for multiple vehicles.",
    beds: 4,
    baths: 3,
    parking: 2,
    landSqm: 740,
    floorSqm: 420,
    images: [
      { sourceRef: "/images/courtyard.jpg", storageKey: null, alt: "Sunlit courtyard and tranquil pool terrace", position: 0 },
      { sourceRef: "/images/architecture-detail.jpg", storageKey: null, alt: "Architectural detail of travertine and dark timber", position: 1 },
      { sourceRef: "/images/quiet-interior.jpg", storageKey: null, alt: "Serene living room with fireplace", position: 2 },
    ],
  },
  {
    slug: "fitzroy-light-filled-penthouse",
    headline: "Fitzroy Light-Filled Penthouse",
    status: "ACTIVE",
    listingType: "SALE",
    category: "APARTMENT",
    addressLine: "105 Gertrude Street",
    suburb: "Fitzroy",
    postcode: "3065",
    state: "VIC",
    priceLabel: "$1,680,000",
    priceMin: 1600000,
    priceMax: 1750000,
    description: "An urban sanctuary situated on the top floor of an intimate boutique development on iconic Gertrude Street.\n\nFeaturing an open plan layout bathed in northern sunlight, industrial steel beams, refined micro-cement finishes, and wrap-around balconies framing Carlton Gardens.\n\nOnly footsteps to acclaimed dining, independent galleries, and the Melbourne CBD.",
    beds: 2,
    baths: 2,
    parking: 1,
    landSqm: null,
    floorSqm: 135,
    images: [
      { sourceRef: "/images/interior-light.jpg", storageKey: null, alt: "Luminous interior with bespoke steel fixtures", position: 0 },
      { sourceRef: "/images/terrace.jpg", storageKey: null, alt: "Private rooftop terrace", position: 1 },
    ],
  },
  {
    slug: "brunswick-creative-studio-commercial",
    headline: "Brunswick Creative Studio & Warehouse",
    status: "ACTIVE",
    listingType: "SALE",
    category: "COMMERCIAL",
    addressLine: "240 Sydney Road",
    suburb: "Brunswick",
    postcode: "3056",
    state: "VIC",
    priceLabel: "$2,150,000",
    priceMin: 2000000,
    priceMax: 2300000,
    description: "A rare freehold commercial offering showcasing exposed red brickwork, soaring timber trusses, and versatile zoned floorplates.\n\nIdeal for creative headquarters, design studios, or specialty showrooms seeking high pedestrian exposure and rear lane loading access.",
    beds: null,
    baths: 2,
    parking: 3,
    landSqm: 510,
    floorSqm: 390,
    images: [
      { sourceRef: "/images/architecture-detail.jpg", storageKey: null, alt: "Industrial architectural detail and brick facade", position: 0 },
      { sourceRef: "/images/courtyard.jpg", storageKey: null, alt: "Internal warehouse courtyard", position: 1 },
    ],
  },
  {
    slug: "mornington-coastal-acreage-land",
    headline: "Mornington Peninsula Coastal Allotment",
    status: "ACTIVE",
    listingType: "SALE",
    category: "LAND",
    addressLine: "15 Esplanade",
    suburb: "Mornington",
    postcode: "3931",
    state: "VIC",
    priceLabel: "$1,920,000",
    priceMin: 1850000,
    priceMax: 2000000,
    description: "An exceptional, level parcel of coastal land offering elevated vistas towards Port Phillip Bay and the Melbourne city skyline.\n\nSurrounded by native coastal tea tree and architectural residences, this ready-to-build site offers approved plans for a luxury two-storey home.",
    beds: null,
    baths: null,
    parking: null,
    landSqm: 1320,
    floorSqm: null,
    images: [
      { sourceRef: "/images/courtyard.jpg", storageKey: null, alt: "Coastal land allotment with native flora", position: 0 },
      { sourceRef: "/images/terrace.jpg", storageKey: null, alt: "Elevated coastal views", position: 1 },
    ],
  },
];

export function filterMockListings(searchParams: URLSearchParams, defaultType?: string, defaultCategory?: string) {
  const type = defaultType || searchParams.get("type");
  const category = defaultCategory || searchParams.get("category");
  const suburb = searchParams.get("suburb")?.trim().toLowerCase();
  const beds = searchParams.get("beds") ? Number(searchParams.get("beds")) : null;
  const baths = searchParams.get("baths") ? Number(searchParams.get("baths")) : null;
  const parking = searchParams.get("parking") ? Number(searchParams.get("parking")) : null;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 12;

  let filtered = MOCK_LISTINGS.filter((item) => {
    if (type && item.listingType !== type) return false;
    if (category && item.category !== category) return false;
    if (suburb && !item.suburb.toLowerCase().includes(suburb)) return false;
    if (beds !== null && (item.beds === null || item.beds < beds)) return false;
    if (baths !== null && (item.baths === null || item.baths < baths)) return false;
    if (parking !== null && (item.parking === null || item.parking < parking)) return false;
    if (minPrice !== null && item.priceMin && item.priceMin < minPrice) return false;
    if (maxPrice !== null && item.priceMax && item.priceMax > maxPrice) return false;
    return true;
  });

  if (sort === "price-asc") {
    filtered.sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => (b.priceMax || 0) - (a.priceMax || 0));
  }

  const total = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((item) => ({
    slug: item.slug,
    headline: item.headline,
    suburb: item.suburb,
    priceLabel: item.priceLabel,
    beds: item.beds,
    baths: item.baths,
    parking: item.parking,
    category: item.category,
    status: item.status,
  }));

  return { items, total, page, pageSize };
}

export function getMockListingBySlug(slug: string): DetailedListing | null {
  return MOCK_LISTINGS.find((item) => item.slug === slug) || null;
}
