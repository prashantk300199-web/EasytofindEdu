import mongoose from 'mongoose';
import InstituteDraft from '../models/InstituteDraft.js';
import env from '../config/env.js';

/**
 * Migration Script: Phase 6 - Migrate Institute Drafts from 11-step to 14-step structure
 *
 * This script migrates existing institute draft data:
 * - Step 5 (Facilities) → Step 7
 * - Step 6 (Faculty) → Step 8
 * - Step 7 (Fees) → Step 9
 * - Step 8 (Admission) → Step 10
 * - Step 9 (Career) → Step 11 (with enhanced structure)
 * - Step 10 (Gallery) → Step 13
 * - Step 11 (Verification) → Step 14
 *
 * New steps added:
 * - Step 5: Batches & Schedule
 * - Step 6: Learning Experience
 * - Step 12: Results & Achievements
 */

const migratePhase6InstituteDrafts = async () => {
  try {
    console.log('[Migration] Starting Phase 6 Institute Draft Migration...');
    console.log('[Migration] Connecting to MongoDB...');

    await mongoose.connect(env.mongoUri, {
      autoIndex: false,
      maxPoolSize: 10
    });

    console.log('[Migration] Connected to MongoDB successfully');

    // Find all drafts that need migration (those with old step structure)
    const draftsToMigrate = await InstituteDraft.find({
      $or: [
        { step5Facilities: { $exists: true, $ne: null } },
        { step6Faculty: { $exists: true, $ne: null } },
        { step7Fees: { $exists: true, $ne: null } },
        { step8Admission: { $exists: true, $ne: null } },
        { step9Career: { $exists: true, $ne: null } },
        { step10Gallery: { $exists: true, $ne: null } },
        { step11Verification: { $exists: true, $ne: null } }
      ]
    });

    console.log(`[Migration] Found ${draftsToMigrate.length} drafts to migrate`);

    if (draftsToMigrate.length === 0) {
      console.log('[Migration] No drafts need migration. Exiting.');
      await mongoose.disconnect();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const draft of draftsToMigrate) {
      try {
        let updated = false;

        // Migrate Step 5 (Facilities) → Step 7
        if (draft.step5Facilities && !draft.step7Facilities) {
          draft.step7Facilities = draft.step5Facilities;
          updated = true;
          console.log(`[Migration] Draft ${draft._id}: Migrated Facilities (Step 5 → Step 7)`);
        }

        // Migrate Step 6 (Faculty) → Step 8
        if (draft.step6Faculty && !draft.step8Faculty) {
          draft.step8Faculty = draft.step6Faculty;
          updated = true;
          console.log(`[Migration] Draft ${draft._id}: Migrated Faculty (Step 6 → Step 8)`);
        }

        // Migrate Step 7 (Fees) → Step 9
        if (draft.step7Fees && !draft.step9Fees) {
          draft.step9Fees = draft.step7Fees;
          updated = true;
          console.log(`[Migration] Draft ${draft._id}: Migrated Fees (Step 7 → Step 9)`);
        }

        // Migrate Step 8 (Admission) → Step 10
        if (draft.step8Admission && !draft.step10Admission) {
          draft.step10Admission = draft.step8Admission;
          updated = true;
          console.log(`[Migration] Draft ${draft._id}: Migrated Admission (Step 8 → Step 10)`);
        }

        // Migrate Step 9 (Career) → Step 11 with enhanced structure
        if (draft.step9Career && !draft.step11Career) {
          const oldCareer = draft.step9Career;

          // Map old career structure to new enhanced structure
          draft.step11Career = {
            // Preserve existing data
            topRecruiters: oldCareer.topRecruiters,
            industryPartners: oldCareer.industryPartners,
            averagePackage: oldCareer.averagePackage,
            highestPackage: oldCareer.highestPackage,
            placementRate: oldCareer.placementRate?.toString(),
            careerOutcomes: oldCareer.careerOutcomes,

            // Map old careerServices array to new boolean fields
            placementAssistance: oldCareer.careerServices?.includes('Placement Assistance') || false,
            jobAssistance: oldCareer.careerServices?.includes('Job Assistance') || false,
            internshipAssistance: oldCareer.careerServices?.includes('Internship Assistance') || false,
            careerCounselling: oldCareer.careerServices?.includes('Career Counselling') || false,

            // Initialize new fields as false
            freelancingSupport: false,
            businessSupport: false,
            industryConnections: false,
            portfolioDevelopment: false,
            certification: false,
            performanceOpportunities: false,
            competitionOpportunities: false,
            furtherEducationGuidance: false
          };

          updated = true;
          console.log(`[Migration] Draft ${draft._id}: Migrated Career (Step 9 → Step 11 with enhanced structure)`);
        }

        // Migrate Step 10 (Gallery) → Step 13
        if (draft.step10Gallery && !draft.step13Gallery) {
          draft.step13Gallery = draft.step10Gallery;
          updated = true;
          console.log(`[Migration] Draft ${draft._id}: Migrated Gallery (Step 10 → Step 13)`);
        }

        // Migrate Step 11 (Verification) → Step 14
        if (draft.step11Verification && !draft.step14Verification) {
          draft.step14Verification = draft.step11Verification;
          updated = true;
          console.log(`[Migration] Draft ${draft._id}: Migrated Verification (Step 11 → Step 14)`);
        }

        // Update currentStep if it's pointing to old step numbers
        if (draft.currentStep > 4 && draft.currentStep <= 11) {
          // Map old step numbers to new step numbers
          const stepMapping = {
            5: 7,   // Facilities
            6: 8,   // Faculty
            7: 9,   // Fees
            8: 10,  // Admission
            9: 11,  // Career
            10: 13, // Gallery
            11: 14  // Verification
          };

          const newStep = stepMapping[draft.currentStep];
          if (newStep) {
            draft.currentStep = newStep;
            updated = true;
            console.log(`[Migration] Draft ${draft._id}: Updated currentStep ${draft.currentStep} → ${newStep}`);
          }
        }

        if (updated) {
          // Recalculate completion percentage
          draft.calculateCompletion();

          // Save the migrated draft
          await draft.save();
          migratedCount++;
          console.log(`[Migration] Draft ${draft._id}: Successfully migrated`);
        } else {
          console.log(`[Migration] Draft ${draft._id}: No migration needed`);
        }

      } catch (error) {
        errorCount++;
        console.error(`[Migration] Error migrating draft ${draft._id}:`, error.message);
      }
    }

    console.log('\n[Migration] Phase 6 Migration Complete!');
    console.log(`[Migration] Total drafts found: ${draftsToMigrate.length}`);
    console.log(`[Migration] Successfully migrated: ${migratedCount}`);
    console.log(`[Migration] Errors: ${errorCount}`);

    await mongoose.disconnect();
    console.log('[Migration] Disconnected from MongoDB');

  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run migration
migratePhase6InstituteDrafts();
