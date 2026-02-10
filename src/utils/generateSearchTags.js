const generateSearchTags = (hostel) => {
  const tags = new Set();

  if (hostel.hostel_type) {
    tags.add(`${hostel.hostel_type} hostel`);
  }

  if (hostel.address?.city) {
    tags.add(hostel.address.city.toLowerCase());
    tags.add(`hostel in ${hostel.address.city.toLowerCase()}`);
    if (hostel.hostel_type) {
      tags.add(`${hostel.hostel_type} hostel in ${hostel.address.city.toLowerCase()}`);
    }
  }

  if (hostel.address?.state) {
    tags.add(hostel.address.state.toLowerCase());
  }

  if (hostel.address?.pincode) {
    tags.add(hostel.address.pincode);
  }

  if (hostel.rent?.monthly) {
    if (hostel.rent.monthly <= 5000) tags.add("budget hostel");
    if (hostel.rent.monthly <= 3000) tags.add("cheap hostel");
    if (hostel.rent.monthly >= 10000) tags.add("premium hostel");
  }

  if (hostel.amenities?.length) {
    hostel.amenities.forEach((a) => tags.add(a.replace(/_/g, " ")));
  }

  if (hostel.rooms?.length) {
    hostel.rooms.forEach((r) => tags.add(`${r.room_type} room`));
  }

  if (hostel.meal_plan?.breakfast || hostel.meal_plan?.lunch || hostel.meal_plan?.dinner) {
    tags.add("hostel with food");
    tags.add("mess facility");
  }

  return Array.from(tags);
};

export default generateSearchTags;