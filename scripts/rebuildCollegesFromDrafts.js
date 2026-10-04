/**
 * One-shot backfill: rebuild the public CollegeProfile (college.model.js) for every
 * verified CollegeDraft using the current draft → CollegeProfile mapping
 * (src/utils/collegeTransform.js).
 *
 * Usage:
 *   node scripts/rebuildCollegesFromDrafts.js --dry-run
 *   node scripts/rebuildCollegesFromDrafts.js
 *   node scripts/rebuildCollegesFromDrafts.js --owner=<ownerObjectId>
 *   node scripts/rebuildCollegesFromDrafts.js --draft=<draftObjectId>
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnection from '../src/config/db.js';
import CollegeDraft from '../src/models/CollegeDraft.js';
import CollegeProfile from '../src/models/college.model.js';
import { buildCollegeUpdateFromDraft } from '../src/utils/collegeTransform.js';

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    })
);

const dryRun = !!args['dry-run'];
const filterOwner = args.owner;
const filterDraftId = args.draft;

const summarize = (doc) => ({
  name: doc?.name,
  hasAbout: !!doc?.about,
  hasContact: !!doc?.contact?.address,
  hasPlacements: !!(doc?.placements?.placementPercentage || doc?.placements?.averagePackage),
  hasHostel: !!doc?.hostel,
  coursesCount: Array.isArray(doc?.coursesOffered) ? doc.coursesOffered.length : 0,
  isApproved: doc?.isApproved,
});

(async () => {
  await dbConnection();

  const query = { verificationStatus: 'verified' };
  if (filterDraftId) query._id = filterDraftId;
  if (filterOwner) query.owner = filterOwner;

  const drafts = await CollegeDraft.find(query).sort({ submittedAt: 1 });
  console.log(`[rebuild] ${drafts.length} verified college drafts matched. dry-run=${dryRun}`);

  let touched = 0;
  for (const draft of drafts) {
    const label = `${draft.step1BasicInfo?.collegeName || '(unnamed)'} [draft=${draft._id} owner=${draft.owner}]`;
    const before = await CollegeProfile.findOne({ createdBy: draft.owner });
    const update = buildCollegeUpdateFromDraft(draft);

    if (dryRun) {
      console.log(`[rebuild] DRY ${label}`);
      console.log(`  $set keys:   ${Object.keys(update.$set).join(', ')}`);
      console.log(`  $unset keys: ${Object.keys(update.$unset).join(', ')}`);
      continue;
    }

    try {
      await CollegeProfile.findOneAndUpdate(
        { createdBy: draft.owner },
        update,
        { upsert: true, new: true, runValidators: true },
      );
      const after = await CollegeProfile.findOne({ createdBy: draft.owner });
      console.log(`[rebuild] OK   ${label}`);
      console.log(`  before: ${JSON.stringify(summarize(before))}`);
      console.log(`  after:  ${JSON.stringify(summarize(after))}`);
      touched++;
    } catch (err) {
      console.error(`[rebuild] FAIL ${label}: ${err.message}`);
    }
  }

  console.log(`[rebuild] done. ${dryRun ? '(dry-run, no writes)' : `${touched} updated.`}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('[rebuild] fatal:', err);
  process.exit(1);
});