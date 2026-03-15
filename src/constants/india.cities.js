// Comprehensive list of major Indian cities for career guidance
// Used for relocation preferences

export const INDIA_CITIES = [
  // METROS (Tier 1)
  {
    id: 1,
    name: "Delhi",
    state: "Delhi",
    tier: "metro",
    region: "north",
    opportunities: "high",
  },
  {
    id: 2,
    name: "Mumbai",
    state: "Maharashtra",
    tier: "metro",
    region: "west",
    opportunities: "very_high",
  },
  {
    id: 3,
    name: "Bangalore",
    state: "Karnataka",
    tier: "metro",
    region: "south",
    opportunities: "very_high",
  },
  {
    id: 4,
    name: "Hyderabad",
    state: "Telangana",
    tier: "metro",
    region: "south",
    opportunities: "very_high",
  },
  {
    id: 5,
    name: "Chennai",
    state: "Tamil Nadu",
    tier: "metro",
    region: "south",
    opportunities: "high",
  },
  {
    id: 6,
    name: "Kolkata",
    state: "West Bengal",
    tier: "metro",
    region: "east",
    opportunities: "high",
  },

  // TIER 2 CITIES
  {
    id: 7,
    name: "Pune",
    state: "Maharashtra",
    tier: "tier2",
    region: "west",
    opportunities: "high",
  },
  {
    id: 8,
    name: "Ahmedabad",
    state: "Gujarat",
    tier: "tier2",
    region: "west",
    opportunities: "high",
  },
  {
    id: 9,
    name: "Jaipur",
    state: "Rajasthan",
    tier: "tier2",
    region: "north",
    opportunities: "medium",
  },
  {
    id: 10,
    name: "Indore",
    state: "Madhya Pradesh",
    tier: "tier2",
    region: "central",
    opportunities: "medium",
  },
  {
    id: 11,
    name: "Lucknow",
    state: "Uttar Pradesh",
    tier: "tier2",
    region: "north",
    opportunities: "medium",
  },
  {
    id: 12,
    name: "Kochi",
    state: "Kerala",
    tier: "tier2",
    region: "south",
    opportunities: "medium",
  },
  {
    id: 13,
    name: "Chandigarh",
    state: "Chandigarh",
    tier: "tier2",
    region: "north",
    opportunities: "high",
  },
  {
    id: 14,
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    tier: "tier2",
    region: "south",
    opportunities: "medium",
  },
  {
    id: 15,
    name: "Surat",
    state: "Gujarat",
    tier: "tier2",
    region: "west",
    opportunities: "high",
  },

  // TIER 3 CITIES
  {
    id: 16,
    name: "Nagpur",
    state: "Maharashtra",
    tier: "tier3",
    region: "central",
    opportunities: "medium",
  },
  {
    id: 17,
    name: "Bhopal",
    state: "Madhya Pradesh",
    tier: "tier3",
    region: "central",
    opportunities: "medium",
  },
  {
    id: 18,
    name: "Coimbatore",
    state: "Tamil Nadu",
    tier: "tier3",
    region: "south",
    opportunities: "medium",
  },
  {
    id: 19,
    name: "Vadodara",
    state: "Gujarat",
    tier: "tier3",
    region: "west",
    opportunities: "medium",
  },
  {
    id: 20,
    name: "Ghaziabad",
    state: "Uttar Pradesh",
    tier: "tier3",
    region: "north",
    opportunities: "low",
  },
];

export const getCitiesByRegion = (region) => {
  return INDIA_CITIES.filter((city) => city.region === region);
};

export const getCitiesByTier = (tier) => {
  return INDIA_CITIES.filter((city) => city.tier === tier);
};

export const getCityById = (id) => {
  return INDIA_CITIES.find((city) => city.id === id);
};

export default INDIA_CITIES;