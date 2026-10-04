/**
 * One-shot migration: rebuild the public Institute document for every
 * verified InstituteDraft using the current draft → Institute mapping
 * (src/utils/instituteTransform.js).
 *
 * Use this after fixing the approval transform so already-published
 * institutes pick up the corrected shape without owners having to
 * re-submit.
 *
 * Usage:
 *   node scripts/rebuildInstitutesFromDrafts.js --dry-run   # preview only
 *   node scripts/rebuildInstitutesFromDrafts.js             # apply to all verified drafts
 *   node scripts/rebuildInstitutesFromDrafts.js --owner=<ownerObjectId>
 *   node scripts/rebuildInstitutesFromDrafts.js --draft=<draftObjectId>
 *
 * Idempotent — re-running is safe.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnection from '../src/config/db.js';
import InstituteDraft from '../src/models/InstituteDraft.js';
import Institute from '../src/models/Institute.js';
import { buildInstituteUpdateFromDraft } from '../src/utils/instituteTransform.js';

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

const subdocHasValue = (sub) => {
  if (!sub) return false;
  const o = typeof sub.toObject === 'function' ? sub.toObject() : sub;
  return Object.values(o || {}).some((v) => v && (typeof v !== 'object' || (Array.isArray(v) ? v.length : true)));
};

const summarize = (doc) => ({
  name: doc?.name,
  hasAbout: !!doc?.about,
  hasFacilities: subdocHasValue(doc?.facilities),
  hasFacilityList: Array.isArray(doc?.facilityList) && doc.facilityList.length > 0,
  hasTransparency: subdocHasValue(doc?.transparency),
  hasAcademic: subdocHasValue(doc?.academicInfo),
  hasGallery: Array.isArray(doc?.galleryImages) && doc.galleryImages.length > 0,
  hasDirector: !!doc?.directorName,
  hasWebsite: !!doc?.websiteUrl,
  fieldCount: Object.keys(doc || {}).length,
});

(async () => {
  await dbConnection();

  const query = { verificationStatus: 'verified' };
  if (filterDraftId) query._id = filterDraftId;
  if (filterOwner) query.owner = filterOwner;

  const drafts = await InstituteDraft.find(query).sort({ submittedAt: 1 });
  console.log(`[rebuild] ${drafts.length} verified drafts matched. dry-run=${dryRun}`);

  let touched = 0;
  for (const draft of drafts) {
    const label = `${draft.step1InstituteInfo?.instituteName || '(unnamed)'} [draft=${draft._id} owner=${draft.owner}]`;
    const before = await Institute.findOne({ createdBy: draft.owner });
    const update = buildInstituteUpdateFromDraft(draft);

    if (dryRun) {
      console.log(`[rebuild] DRY ${label}`);
      console.log(`  $set keys:   ${Object.keys(update.$set).join(', ')}`);
      console.log(`  $unset keys: ${Object.keys(update.$unset).join(', ')}`);
      continue;
    }

    try {
      await Institute.findOneAndUpdate(
        { createdBy: draft.owner },
        update,
        { upsert: true, new: true, runValidators: true }
      );
      const after = await Institute.findOne({ createdBy: draft.owner });
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