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
  "Patna": ["Boring Road", "Fraser Road", "Bailey Road"],
  "Gaya": ["Bodh Gaya", "Station Road", "Ashok Nagar"],
  "Bhagalpur": ["College Road", "Shahkund", "Nathnagar"]
};

async function seedSimple() {
  console.log('🌱 Seeding locations...');
  
  try {
    for (const [cityName, areaNames] of Object.entries(locations)) {
      console.log(`📍 Creating ${cityName}...`);
      
      const city = await City.create({ name: cityName });
      console.log(`  🏙️ City created: ${cityName}`);
      
      for (const areaName of areaNames) {
        console.log(`    🏘️ Creating area: ${areaName}`);
        const area = await Area.create({ name: areaName, city: city._id });
        
        // Create a sample subarea
        await SubArea.create({ 
          name: `${areaName} Central Zone`, 
          area: area._id 
        });
        console.log(`      🏠 Area and subarea created`);
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
