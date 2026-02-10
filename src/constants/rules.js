const RULES = [
  { id: 1, key: "no_smoking", label: "No Smoking" },
  { id: 2, key: "no_alcohol", label: "No Alcohol" },
  { id: 3, key: "no_pets", label: "No Pets" },
  { id: 4, key: "no_loud_music", label: "No Loud Music" },
  { id: 5, key: "id_proof_required", label: "ID Proof Required" },
  { id: 6, key: "gate_closing", label: "Gate Closing Time Enforced" },
  { id: 7, key: "no_opposite_gender", label: "No Opposite Gender Visitors" },
  { id: 8, key: "maintain_cleanliness", label: "Maintain Cleanliness" },
  { id: 9, key: "no_damage_property", label: "No Damage to Property" },
  { id: 10, key: "report_issues", label: "Report Issues to Warden" },
  { id: 11, key: "follow_meal_timings", label: "Follow Meal Timings" },
  { id: 12, key: "no_cooking_in_room", label: "No Cooking in Room" },
  { id: 13, key: "electricity_conservation", label: "Conserve Electricity" },
  { id: 14, key: "night_silence", label: "Maintain Silence After 10 PM" },
  { id: 15, key: "visitor_register", label: "Register All Visitors" },
];

export const RULE_KEYS = RULES.map((r) => r.key);

export default RULES;