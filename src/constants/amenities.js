const AMENITIES = {
  // 1. Room Amenities
  room: [
    { key: "mattress", label: "Mattress" },
    { key: "pillow", label: "Pillow" },
    { key: "bed_with_storage", label: "Bed with Storage" },
    { key: "bed_without_storage", label: "Bed without Storage" },
    { key: "wardrobe", label: "Wardrobe / Almirah" },
    { key: "study_table", label: "Study Table" },
    { key: "study_chair", label: "Study Chair" },
    { key: "bookshelf", label: "Bookshelf" },
    { key: "shoe_rack", label: "Shoe Rack" },
    { key: "mirror", label: "Mirror" },
    { key: "curtains", label: "Curtains" },
    { key: "fan", label: "Fan" },
    { key: "ac", label: "Air Conditioning (AC)" },
    { key: "cooler", label: "Air Cooler" },
    { key: "room_heater", label: "Room Heater" },
    { key: "attached_bathroom", label: "Attached Bathroom" },
    { key: "balcony", label: "Private Balcony" },
  ],

  // 2. Washroom Amenities
  washroom: [
    { key: "indian_toilet", label: "Indian Toilet" },
    { key: "western_toilet", label: "Western Toilet" },
    { key: "geyser", label: "Geyser / Hot Water" },
    { key: "24x7_water_in_washroom", label: "24x7 Washroom Water" },
    { key: "separate_bath_and_toilet", label: "Separate Bath & Toilet" },
  ],

  // 3. Food & Kitchen
  food: [
    { key: "mess_facility", label: "Mess / Food Facility" },
    { key: "veg_food", label: "Pure Veg Food" },
    { key: "non_veg_food", label: "Non-Veg Food Available" },
    { key: "breakfast_available", label: "Breakfast" },
    { key: "lunch_available", label: "Lunch" },
    { key: "dinner_available", label: "Dinner" },
    { key: "dining_hall", label: "Dining Hall" },
    { key: "inhouse_kitchen", label: "In-house Kitchen" },
    { key: "tiffin_service", label: "Tiffin Service" },
    { key: "refrigerator", label: "Common Refrigerator" },
    { key: "induction_allowed", label: "Induction Allowed in Room" },
  ],

  // 4. Water & Utilities
  utilities: [
    { key: "ro_water", label: "RO Drinking Water" },
    { key: "water_cooler", label: "Water Cooler" },
    { key: "24x7_water_supply", label: "24x7 General Water Supply" },
    { key: "electricity_backup", label: "Power Backup (Generator)" },
    { key: "inverter_backup", label: "Inverter Backup" },
  ],

  // 5. Internet & Connectivity
  connectivity: [
    { key: "wifi", label: "Wi-Fi" },
    { key: "high_speed_internet", label: "High-Speed Internet" },
  ],

  // 6. Laundry & Cleaning
  cleaning: [
    { key: "washing_machine", label: "Washing Machine" },
    { key: "paid_laundry_service", label: "Paid Laundry Service" },
    { key: "drying_area", label: "Clothes Drying Area" },
    { key: "daily_room_cleaning", label: "Daily Room Cleaning" },
    { key: "weekly_room_cleaning", label: "Weekly Room Cleaning" },
  ],

  // 7. Safety & Security
  security: [
    { key: "cctv", label: "CCTV Surveillance" },
    { key: "security_guard_24x7", label: "24x7 Security Guard" },
    { key: "biometric_entry", label: "Biometric / Card Entry" },
    { key: "visitor_register", label: "Visitor Register" },
    { key: "fire_extinguisher", label: "Fire Extinguisher" },
    { key: "first_aid_kit", label: "First Aid Kit" },
    { key: "full_time_warden", label: "Full-time Warden" },
  ],

  // 8. Building & Accessibility
  building: [
    { key: "lift", label: "Lift / Elevator" },
    { key: "parking", label: "Parking Space" },
    { key: "wheelchair_access", label: "Wheelchair Accessible" },
    { key: "terrace_access", label: "Terrace Access" },
  ],

  // 9. Common & Recreation
  recreation: [
    { key: "common_hall", label: "Common Hall / Lounge" },
    { key: "study_room", label: "Dedicated Study Room" },
    { key: "library", label: "Library" },
    { key: "gym", label: "Gym / Fitness Center" },
    { key: "indoor_games", label: "Indoor Games (TT, Carrom, etc.)" },
    { key: "newspaper_magazine", label: "Newspapers & Magazines" },
    { key: "tv_in_common_area", label: "TV in Common Area" },
  ],
};

// Yeh loop saare keys ko ek single array mein nikaal lega for Validation
export const AMENITY_KEYS = Object.values(AMENITIES).flatMap((cat) => cat.map((a) => a.key));

export default AMENITIES;