/**
 * Maps a verified CollegeDraft → CollegeProfile (public college.model.js) update.
 * Used by both admin approval flow (services/collegeApplication.service.js) and the
 * one-shot backfill script (scripts/rebuildCollegesFromDrafts.js).
 *
 * Returns { $set, $unset } — pass directly to findOneAndUpdate for a partial merge
 * with runValidators: true. Same pattern as utils/instituteTransform.js.
 */

const splitList = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * @param {object} draft  CollegeDraft document (Mongoose or plain).
 * @returns {{ $set: object, $unset: object }}
 */
export function buildCollegeUpdateFromDraft(draft) {
  const s1 = draft.step1BasicInfo || {};
  const s2 = draft.step2Location || {};
  const s3 = draft.step3Affiliation || {};
  const s4 = draft.step4Courses || {};
  const s5 = draft.step5AdmissionFees || {};
  const s6 = draft.step6Facilities || {};
  const s7 = draft.step7Hostel || {};
  const s8 = draft.step8Placements || {};
  const s9 = draft.step9Scholarships || {};
  const s10 = draft.step10Gallery || {};

  const $set = {};

  // ── Identity ──
  if (s1.collegeName) $set.name = s1.collegeName;
  if (s1.shortName) $set.shortName = s1.shortName;
  if (s1.about) $set.about = s1.about;
  // establishedYear is optional; fall back to current year so drafts that
  // skipped it don't fail the upsert when runValidators is on.
  const establishedYear = s1.establishedYear || new Date().getFullYear();
  $set.establishedYear = establishedYear;

  // College type / ownership
  if (s1.institutionType) $set.collegeType = s1.institutionType;
  if (s1.ownershipType) $set.ownershipType = s1.ownershipType;

  // Images
  if (s1.logoFile) $set.logo = s1.logoFile; // CollegeProfile stores logo as String URL
  if (Array.isArray(s10.galleryFiles) && s10.galleryFiles.length) {
    $set.bannerImages = s10.galleryFiles.filter(Boolean);
  }

  // ── Affiliation & Recognition ──
  if (s3.affiliatedUniversity) $set.affiliatedUniversity = s3.affiliatedUniversity;
  if (s3.accreditationGrade) $set.naacGrade = s3.accreditationGrade;

  const approvedBy = [];
  if (s3.ugcRecognized) approvedBy.push('UGC');
  if (s3.aicteApproved) approvedBy.push('AICTE');
  if (s3.nbaAccredited) approvedBy.push('NBA');
  if (s3.naacAccredited) approvedBy.push('NAAC');
  if (s3.otherRecognition) approvedBy.push(...splitList(s3.otherRecognition));
  if (approvedBy.length) $set.approvedBy = approvedBy;

  const accreditation = [];
  if (s3.naacAccredited) accreditation.push('NAAC');
  if (s3.nbaAccredited) accreditation.push('NBA');
  if (accreditation.length) $set.accreditation = accreditation;

  // Rankings
  const rankings = {};
  if (s3.nirfRank) rankings.nirf = s3.nirfRank;
  if (Object.keys(rankings).length) $set.rankings = rankings;

  // ── Contact ──
  const contact = {};
  if (s1.website) contact.website = s1.website;
  if (s1.contactEmail) contact.email = s1.contactEmail;
  if (s2.fullAddress) contact.address = s2.fullAddress;
  // Phone isn't on CollegeProfile — but address/email/website cover the spec.
  if (Object.keys(contact).length) $set.contact = contact;

  // ── Admission ──
  const admission = {};
  if (s5.admissionProcess) admission.process = s5.admissionProcess;
  if (Object.keys(admission).length) $set.admission = admission;

  // ── Placements ──
  const placements = {};
  if (typeof s8.placementRate === 'number') placements.placementPercentage = s8.placementRate;
  if (typeof s8.highestPackage === 'number') placements.highestPackage = s8.highestPackage;
  if (typeof s8.averagePackage === 'number') placements.averagePackage = s8.averagePackage;
  if (s8.internshipOpportunities) placements.internshipPercentage = s8.placementRate || 0;
  const recruiters = splitList(s8.topRecruiters);
  if (recruiters.length) placements.topRecruiters = recruiters;
  if (Object.keys(placements).length) $set.placements = placements;

  // ── Hostel ──
  if (typeof s7.isAvailable === 'boolean') {
    $set.hostel = {
      isAvailable: s7.isAvailable,
      monthlyFee: s7.hostelFees || undefined,
      yearlyFee: s7.hostelFees ? s7.hostelFees * 12 : undefined,
      foodIncluded: true,
      otherFees: 0,
    };
  }

  // ── Courses (built from step 4 + step 5 fees) ──
  if (Array.isArray(s4.courses) && s4.courses.length) {
    $set.coursesOffered = s4.courses
      .filter((c) => c && c.courseName)
      .map((c) => ({
        course: c.courseName,
        examsAccepted: c.entranceExam ? [c.entranceExam] : [],
        fees: {
          tuitionFee: c.courseFee || 0,
          examFee: 0,
          securityFee: 0,
          developmentFee: 0,
          uniformLabCharges: 0,
          otherFees: 0,
          totalYearlyExpense: c.courseFee || 0,
        },
        cutoffs: [],
      }));
  }

  // ── Bookkeeping ──
  $set.createdBy = draft.owner;
  $set.isActive = true;
  $set.isApproved = true;
  $set.verificationStatus = 'verified';

  // Strip legacy junk if any older approval path wrote it
  const $unset = {
    description: '',
    collegeOwnerRef: '',
    ownerEmail: '',
  };

  return { $set, $unset };
}