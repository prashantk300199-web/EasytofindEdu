import crypto from "crypto";

const PREFIXES = [
  "Sunrise", "Silver", "Golden", "Royal", "Blue",
  "Green", "Star", "Diamond", "Crystal", "Pearl",
  "Emerald", "Coral", "Amber", "Ivory", "Jade",
  "Maple", "Cedar", "Willow", "Orchid", "Lotus",
  "Haven", "Nest", "Crest", "Vista", "Zenith",
  "Horizon", "Summit", "Bright", "Noble", "Grand",
  "Urban", "Metro", "Sky", "Cloud", "Nova",
  "Serene", "Tranquil", "Bliss", "Prime", "Elite",
];

const SUFFIXES = [
  "Stay", "Residency", "Living", "Nest", "Haven",
  "Villa", "Den", "Abode", "Corner", "Hub",
  "House", "Lodge", "Shelter", "Place", "Home",
  "Pad", "Quarters", "Retreat", "Space", "Zone",
  "Court", "Towers", "Heights", "Square", "Park",
  "Gardens", "Enclave", "Mansion", "Suites", "Inn",
  "Harbour", "Point", "Bay", "Terrace", "Row",
];

const maskName = (realName, hostelId = "") => {
  const seed = realName + hostelId;
  const hash = crypto.createHash("md5").update(seed).digest("hex");

  const prefixIndex = parseInt(hash.substring(0, 8), 16) % PREFIXES.length;
  const suffixIndex = parseInt(hash.substring(8, 16), 16) % SUFFIXES.length;

  const prefix = PREFIXES[prefixIndex];
  const suffix = SUFFIXES[suffixIndex];

  if (prefix === suffix) {
    const altIndex = (suffixIndex + 1) % SUFFIXES.length;
    return `${prefix} ${SUFFIXES[altIndex]}`;
  }

  return `${prefix} ${suffix}`;
};

export default maskName;