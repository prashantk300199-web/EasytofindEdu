// Simple version without complex imports
console.log('🚀 Starting simple Bihar location seeding...');

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Simple connection
console.log('🔗 Connecting to database...');
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/institute_db')
  .then(() => console.log('✅ Connected to database'))
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });

// Simple schemas
const citySchema = new mongoose.Schema({ name: String });
const areaSchema = new mongoose.Schema({ name: String, city: mongoose.Schema.Types.ObjectId });
const subAreaSchema = new mongoose.Schema({ name: String, area: mongoose.Schema.Types.ObjectId });

const City = mongoose.model('City', citySchema);
const Area = mongoose.model('Area', areaSchema);
const SubArea = mongoose.model('SubArea', subAreaSchema);

const locations = {
  "Patna": [
    "Boring Road",
    "Fraser Road",
    "Bailey Road",
    "Kankarbagh",
    "Patliputra Colony",
    "Rajendra Nagar",
    "Gandhi Maidan",
    "Digha",
    "Bankipore"
  ],
  "Gaya": [
    "Bodh Gaya",
    "Station Road",
    "Ashok Nagar",
    "Indira Colony",
    "Rajbari",
    "Shivala"
  ],
  "Bhagalpur": [
    "College Road",
    "Shahkund",
    "Nathnagar",
    "Sultanganj",
    "Biharipur",
    "Kahalgaon"
  ],
  "Muzaffarpur": ["Kanti", "Motijheel", "Gola Road", "Bari Bazar", "Kashipur"],
  "Darbhanga": ["Laheriasarai", "Baba Bazaar", "Gandhi Chowk", "Laxmipur", "Kiratpur"],
  "Purnia": ["Main Road", "Station Road", "Old Town", "New Colony", "Bazaar"],
  "Begusarai": ["Dihat", "Bakhari", "Kochadhaman", "Nariyawan"],
  "Bihar Sharif": ["Golghar", "College Road", "Aurangabad Road", "Railway Colony"],
  "Madhubani": ["Kala Bazar", "Sadar Bazar", "Lalitpur", "Old Market"],
  "Ara": ["Mithapur", "Bhojpur Market", "Kalyanpur", "Civil Lines", "Station Road"],
  "Bettiah": ["Station Road", "Court Road", "New Market", "Railway Colony"],
  "Sasaram": ["Station", "Market Area", "Court Road", "Old Town"],
  "Buxar": ["Station Road", "Main Market", "Garden Area", "Railway Colony"],
  "Katihar": ["Hareram Bazar", "Railway Market", "Munshipara", "Colonel Ganj"],
  "Saharsa": ["Main Road", "Bazaar", "Hospital Road", "Station"],
  "Sitamarhi": ["Town Area", "Station Road", "Bazaar", "Old City"],
  "Samastipur": ["Station Road", "Railway Colony", "New Market", "Court Road"],
  "Siwan": ["Station Road", "Bazaar", "New Market", "Railway Colony"],
  "Chapra": ["Station Road", "Bazaar", "Civil Lines", "Court Road"],
  "Hajipur": ["Station Road", "Gandhi Chowk", "New Market", "Old Town"],
  "Kishanganj": ["Main Road", "Bazaar", "Station Area", "Old Market"],
  "Nawada": ["Station Road", "College Road", "Bazaar", "Railway Colony"],
  "Munger": ["Hastings", "Station Road", "New Bazar", "High School Road"],
  "Jamui": ["Station Road", "Town Market", "Old Bazar", "Railway Colony"],
  "Jehanabad": ["Station Road", "Market Area", "Town Hall", "Civil Lines"],
  "Khagaria": ["Station Road", "Bazaar", "Old Town", "New Colony"],
  "Gopalganj": ["Station Road", "Bazaar", "Civil Lines", "Court Road"],
  "Motihari": ["Station Road", "Bazaar", "New Market", "Civil Lines"],
  "Aurangabad": ["Station Road", "Main Bazaar", "Civil Lines", "College Road"]
};

async function seedSimple() {
  console.log('🌱 Seeding locations...');
  
  try {
    for (const [cityName, areaNames] of Object.entries(locations)) {
        console.log(`📍 Ensuring city ${cityName} exists...`);
        // Upsert city to avoid duplicates on re-run
        const city = await City.findOneAndUpdate(
          { name: cityName },
          { $setOnInsert: { name: cityName } },
          { new: true, upsert: true }
        );
        console.log(`  🏙️ City ensured: ${city.name} (${city._id})`);

        for (const areaName of areaNames) {
          console.log(`    🏘️ Ensuring area: ${areaName}`);
          const area = await Area.findOneAndUpdate(
            { name: areaName, city: city._id },
            { $setOnInsert: { name: areaName, city: city._id } },
            { new: true, upsert: true }
          );

          // Upsert a sample subarea
          const subAreaName = `${areaName} Central Zone`;
          await SubArea.findOneAndUpdate(
            { name: subAreaName, area: area._id },
            { $setOnInsert: { name: subAreaName, area: area._id } },
            { new: true, upsert: true }
          );
          console.log(`      🏠 Area and subarea ensured`);
        }
      }
    
    console.log('🎉 Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

setTimeout(seedSimple, 2000); // Give time for connection
