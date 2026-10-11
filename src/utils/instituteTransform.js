/**
 * Single source of truth for turning a verified InstituteDraft into the
 * public-facing Institute document.
 *
 * Used by both the admin approval flow and the one-shot backfill script
 * (scripts/rebuildInstitutesFromDrafts.js) so they cannot drift.
 *
 * The return shape is a Mongo update document — { $set, $unset } — to be
 * passed directly as the second arg to findOneAndUpdate. Using $set/$unset
 * (rather than a plain replacement doc) means:
 *   - fields the transform doesn't know about are preserved;
 *   - legacy junk fields written by older broken approvals are scrubbed;
 *   - re-approval of a changes_requested draft merges cleanly.
 */

const FACILITY_STRING_TO_BOOL = {
  'Wi-Fi': 'wifiCampus',
  'CCTV': 'cctv',
  'Security': 'cctv',
  'Library': 'library',
  'Classrooms': 'smartClass',
  'Computer Lab': 'smartClass',
  'Laboratories': 'smartClass',
  'Parking': 'parking',
  'Cafeteria': 'canteen',
  'Power Backup': 'generatorBackup',
  'Air Conditioning (AC)': 'acClassroom',
  'Medical Facility': 'firstAidKit',
};

const parseExperienceYears = (raw) => {
  if (raw == null) return null;
  const m = String(raw).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

const splitOtherFacilities = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * @param {object} draft  InstituteDraft document (Mongoose or plain).
 * @returns {{ $set: object, $unset: object }}
 */
export function buildInstituteUpdateFromDraft(draft) {
  const s1 = draft.step1InstituteInfo || {};
  const s2 = draft.step2Category || {};
  const s3 = draft.step3LocationContact || {};
  const s4 = draft.step4Courses || {};
  const s6 = draft.step6LearningExperience || {};
  const s7 = draft.step7Facilities || {};
  const s8 = draft.step8Faculty || {};
  const s9 = draft.step9Fees || {};
  const s10 = draft.step10Admission || {};
  const s13 = draft.step13Gallery || {};
  const s14 = draft.step14Verification || {};

  const $set = {};

  // Identity
  if (s1.instituteName) $set.name = s1.instituteName;
  if (s1.about) $set.about = s1.about;
  // establishedYear is optional — fall back to current year so drafts that
  // skipped it don't fail the upsert when runValidators is on.
  const establishedYear = s1.establishedYear || new Date().getFullYear();
  $set.establishedYear = establishedYear;
  if (s1.totalBranches != null && s1.totalBranches !== '') $set.totalBranches = s1.totalBranches;
  if (s1.websiteUrl) $set.websiteUrl = s1.websiteUrl;
  else if (s13.website) $set.websiteUrl = s13.website;

  // Images: draft stores Cloudinary URLs as plain strings; schema wants { url }
  if (s1.logoFile) $set.logo = { url: s1.logoFile };
  if (s1.coverImageFile) $set.coverImage = { url: s1.coverImageFile };

  // Category & subcategories — normalize the new array shape and accept
  // a legacy single-string subcategory field so older drafts remain
  // readable.
  if (s2.primaryCategory) $set.category = s2.primaryCategory;
  const subArr = Array.isArray(s2.subcategories)
    ? s2.subcategories.filter(Boolean)
    : (typeof s2.subcategory === 'string' && s2.subcategory.trim() ? [s2.subcategory.trim()] : []);
  if (subArr.length) $set.subcategories = subArr;

  // Courses (free-text from step 4) — surface their categories for the
  // public detail page and downstream search/filter. Backward-compatible:
  // if the old structure stored courses as plain objects without a
  // category, this simply emits an empty array.
  if (Array.isArray(s4.courses) && s4.courses.length) {
    $set.courseCategories = s4.courses
      .map((c) => (c && typeof c.category === 'string' ? c.category.trim() : ''))
      .filter(Boolean);
  }

  // Director — the registration flow has no dedicated director field, so
  // surface the registering owner's name as the best available signal.
  if (s14.ownerName) $set.directorName = s14.ownerName;

  // Average faculty experience parsed from trainers[].experience strings
  const years = (s8.trainers || [])
    .map((t) => parseExperienceYears(t && t.experience))
    .filter((n) => Number.isFinite(n));
  if (years.length) {
    $set.avgFacultyExperience = Math.round(years.reduce((a, b) => a + b, 0) / years.length);
  }

  // Location — only cityName/areaName/subareaName; no fuzzy ObjectId resolution.
  const loc = {};
  if (s3.state) loc.state = s3.state;
  if (s3.city) loc.cityName = s3.city;
  if (s3.area) loc.areaName = s3.area;
  if (s3.subarea) loc.subareaName = s3.subarea;
  if (s3.fullAddress) loc.fullAddress = s3.fullAddress;
  if (s3.landmark) loc.landmark = s3.landmark;
  // Google Maps coordinates are optional. Only persist them if the owner
  // actually picked a location; never default to (0, 0).
  const lat = parseFloat(s3.latitude);
  const lng = parseFloat(s3.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    loc.latitude = lat;
    loc.longitude = lng;
  }
  if (Object.keys(loc).length) $set.location = loc;

  // Facilities: booleans for known slots + raw string list for everything else.
  const bools = {};
  for (const f of s7.facilities || []) {
    const key = FACILITY_STRING_TO_BOOL[f];
    if (key) bools[key] = true;
  }
  if (Object.keys(bools).length) $set.facilities = bools;

  const facilityList = [
    ...(s7.facilities || []),
    ...splitOtherFacilities(s7.otherFacilities),
  ];
  if (facilityList.length) $set.facilityList = facilityList;

  // Academic info — always build the full object so we never $set both
  // `academicInfo` (replace) and `academicInfo.field` (update) together,
  // which MongoDB rejects as a path conflict.
  const academic = {};
  if (s8.trainerStudentRatio) academic.studentFacultyRatio = s8.trainerStudentRatio;
  if (Array.isArray(s8.teachingMethod) && s8.teachingMethod.length) {
    academic.teachingMethodology = s8.teachingMethod.join(', ');
  } else if (s8.studentSupport) {
    academic.teachingMethodology = s8.studentSupport;
  }
  if (s6.mockTests) academic.mockTestFrequency = 'Regular';
  academic.remedialClasses = Boolean(s6.doubtSessions);
  academic.residentialProgram = Boolean(bools.hostel);
  // Only set the top-level key when the object has at least one field,
  // otherwise MongoDB would $set academicInfo: {} and still allow
  // the dot-notation siblings to be set cleanly.
  if (Object.keys(academic).length) $set.academicInfo = academic;

  // Transparency
  const tr = {};
  if (s10.admissionProcess) tr.admissionProcess = s10.admissionProcess;
  // Fee clarity — per-course fees now live on each course, so we
  // summarize from the courses array when available and only fall back
  // to the legacy single-fee string when an older draft still has it.
  const courseFees = (s4.courses || [])
    .map((c) => c && c.fees && c.fees.totalPayableAmount)
    .filter(Boolean);
  if (courseFees.length) {
    tr.feeClarity = `Course fees: ${courseFees.map((f) => `₹${f}`).join(', ')}`;
  } else if (s9.courseFee) {
    tr.feeClarity = `Course fee: ₹${s9.courseFee}`;
  }
  if (s9.refundPolicy) tr.refundPolicy = s9.refundPolicy;
  if (s9.cancellationPolicy) tr.termsAndConditions = s9.cancellationPolicy;
  if (Object.keys(tr).length) $set.transparency = tr;

  // Per-course fee structures — copy the embedded fees[] block onto
  // the public Institute so course listings can show the full
  // breakdown (registration / admission / course / monthly / total /
  // GST). Always emit an array (even if empty) to keep the field shape
  // stable for downstream consumers.
  if (Array.isArray(s4.courses) && s4.courses.length) {
    $set.courseFees = s4.courses.map((c) => {
      const f = (c && c.fees) || {};
      return {
        courseId: c && (c.id || c._id) ? String(c.id || c._id) : undefined,
        courseName: c && (c.name || c.courseName) ? String(c.name || c.courseName) : undefined,
        registrationFee: f.registrationFee || '',
        admissionFee: f.admissionFee || '',
        courseFee: f.courseFee || '',
        monthlyFee: f.monthlyFee || '',
        quarterlyFee: f.quarterlyFee || '',
        materialFee: f.materialFee || '',
        kitFee: f.kitFee || '',
        examFee: f.examFee || '',
        certificationFee: f.certificationFee || '',
        otherCharges: f.otherCharges || '',
        totalPayableAmount: f.totalPayableAmount || (c && c.totalFees) || '',
        feeIncludesGst: f.feeIncludesGst === true
      };
    });
  }

  // GST status — explicit boolean, not inferred from the amount.
  // Only persist on the public Institute when the draft has actually
  // recorded it, so older drafts / records without the field keep
  // their original `undefined` GST state (which the UI renders as
  // "no GST information on file"). We do not force a default for
  // legacy records.
  if (s9.feeIncludesGst === true || s9.feeIncludesGst === false) {
    $set.feeIncludesGst = s9.feeIncludesGst;
  }

  // Gallery
  if (Array.isArray(s13.galleryFiles) && s13.galleryFiles.length) {
    $set.galleryImages = s13.galleryFiles
      .filter(Boolean)
      .map((url) => ({ url }));
  }

  // Approval bookkeeping
  $set.createdBy = draft.owner;
  $set.isActive = true;
  $set.isApproved = true;

  // Scrub fields that older broken approvals wrote but the Institute schema
  // doesn't have. Mongoose silently drops them on insert; on update they'd
  // linger unless explicitly unset.
  // (NOTE: `category` and `subcategories` are now part of the schema, so
  // they are no longer in this unset list — keeping them here would
  // immediately wipe the values we just $set.)
  const $unset = {
    description: '',
    contact: '',
    'location.pincode': '',
  };

  return { $set, $unset };
}