import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Edit2,
  Send,
  Loader2,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  Award,
  BookOpen,
  Clock,
  DollarSign,
  Briefcase,
  Trophy,
  Image as ImageIcon,
  Shield
} from 'lucide-react';

interface ReviewAndSubmitProps {
  formData: any;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const ReviewAndSubmit: React.FC<ReviewAndSubmitProps> = ({
  formData,
  onEdit,
  onSubmit,
  loading = false
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([1, 2, 3, 4]));

  const toggleSection = (step: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(step)) {
      newExpanded.delete(step);
    } else {
      newExpanded.add(step);
    }
    setExpandedSections(newExpanded);
  };

  // Check if required fields are filled
  const getRequiredFieldsStatus = () => {
    const missing: string[] = [];

    // Step 1 required fields
    if (!formData.step1?.instituteName) missing.push('Institute Name');
    if (!formData.step1?.logoPreview) missing.push('Institute Logo');
    if (!formData.step1?.about) missing.push('Short Description');

    // Step 2 required fields
    if (!formData.step2?.primaryCategory) missing.push('Primary Category');

    // Step 3 required fields
    if (!formData.step3?.officialPhone) missing.push('Official Phone');
    if (!formData.step3?.officialEmail) missing.push('Official Email');
    if (!formData.step3?.fullAddress) missing.push('Complete Address');
    if (!formData.step3?.city) missing.push('City');
    if (!formData.step3?.state) missing.push('State');
    if (!formData.step3?.pincode) missing.push('PIN Code');

    // Step 4 required fields
    if (!formData.step4?.courses || formData.step4.courses.length === 0) {
      missing.push('At least one Course/Program');
    }

    // Step 14 required fields
    if (!formData.step14?.ownerName) missing.push('Authorized Representative Name');
    if (!formData.step14?.designation) missing.push('Representative Designation');
    if (!formData.step14?.idProofPreview) missing.push('Government ID Proof');

    return { missing, isReady: missing.length === 0 };
  };

  const requiredStatus = getRequiredFieldsStatus();

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    const total = 14;

    if (formData.step1?.instituteName) completed++;
    if (formData.step2?.primaryCategory) completed++;
    if (formData.step3?.fullAddress) completed++;
    if (formData.step4?.courses?.length > 0) completed++;
    if (formData.step5?.batches?.length > 0) completed++;
    if (formData.step6) completed++;
    if (formData.step7?.facilities?.length > 0) completed++;
    if (formData.step8?.totalFaculty) completed++;
    if (formData.step9) completed++;
    if (formData.step10) completed++;
    if (formData.step11) completed++;
    if (formData.step12) completed++;
    if (formData.step13) completed++;
    if (formData.step14?.ownerName) completed++;

    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  const SectionCard = ({
    step,
    title,
    icon: Icon,
    children
  }: {
    step: number;
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(step);
    const hasData = formData[`step${step}`] && Object.keys(formData[`step${step}`]).length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-night-800 border border-night-700 rounded-lg overflow-hidden mb-4"
      >
        <div
          className="p-6 flex items-center justify-between cursor-pointer hover:bg-night-750 transition-colors"
          onClick={() => toggleSection(step)}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${hasData ? 'bg-gold-500/10' : 'bg-night-700'}`}>
              <Icon className={`w-6 h-6 ${hasData ? 'text-gold-400' : 'text-cream-100/40'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cream-100">{title}</h3>
              <p className="text-sm text-cream-100/60">
                {hasData ? 'Completed' : 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasData ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-cream-100/40" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(step);
              }}
              className="p-2 hover:bg-night-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-5 h-5 text-gold-400" />
            </button>
          </div>
        </div>

        {isExpanded && hasData && (
          <div className="px-6 pb-6 border-t border-night-700">
            <div className="mt-4 space-y-3">
              {children}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | number | boolean }) => {
    if (!value && value !== 0 && value !== false) return null;

    return (
      <div className="grid grid-cols-3 gap-4">
        <span className="text-cream-100/60 text-sm">{label}:</span>
        <span className="col-span-2 text-cream-100 text-sm">
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl text-cream-100 mb-2">Review & Submit</h1>
        <p className="text-cream-100/60">
          Review all information before submitting for verification
        </p>
      </div>

      {/* Completion Status */}
      <div className="bg-night-800 border border-night-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cream-100">Registration Completion</h3>
          <span className="text-2xl font-bold text-gold-400">{completion}%</span>
        </div>
        <div className="w-full bg-night-900 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            className="bg-gradient-to-r from-gold-500 to-gold-400 h-3 rounded-full"
          />
        </div>
      </div>

      {/* Missing Required Fields Warning */}
      {!requiredStatus.isReady && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Missing Required Information
              </h3>
              <p className="text-cream-100/80 mb-3">
                Please complete the following required fields before submitting:
              </p>
              <ul className="space-y-2">
                {requiredStatus.missing.map((field, idx) => (
                  <li key={idx} className="text-cream-100/70 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Review Sections */}
      <div className="space-y-4 mb-8">
        {/* Step 1: Institute Information */}
        <SectionCard step={1} title="Institute Information" icon={BookOpen}>
          <InfoRow label="Institute Name" value={formData.step1?.instituteName} />
          <InfoRow label="Established Year" value={formData.step1?.establishedYear} />
          <InfoRow label="Registration Number" value={formData.step1?.registrationNumber} />
          <InfoRow label="Total Branches" value={formData.step1?.totalBranches} />
          <InfoRow label="Total Students" value={formData.step1?.totalStudents} />
          <InfoRow label="Website" value={formData.step1?.websiteUrl} />
          {formData.step1?.about && (
            <div>
              <span className="text-cream-100/60 text-sm block mb-1">About:</span>
              <p className="text-cream-100 text-sm">{formData.step1.about}</p>
            </div>
          )}
          {formData.step1?.logoPreview && (
            <div>
              <span className="text-cream-100/60 text-sm block mb-2">Logo:</span>
              <img
                src={formData.step1.logoPreview}
                alt="Institute Logo"
                className="w-24 h-24 object-cover rounded-lg border border-night-700"
              />
            </div>
          )}
        </SectionCard>

        {/* Step 2: Category */}
        <SectionCard step={2} title="Category & Subcategory" icon={Award}>
          <InfoRow label="Primary Category" value={formData.step2?.primaryCategory} />
          {formData.step2?.subcategories && formData.step2.subcategories.length > 0 && (
            <div>
              <span className="text-cream-100/60 text-sm block mb-1">Subcategories:</span>
              <div className="flex flex-wrap gap-2">
                {formData.step2.subcategories.map((sub: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-night-700 text-cream-100 text-sm rounded-lg"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Step 3: Location & Contact */}
        <SectionCard step={3} title="Location & Contact" icon={MapPin}>
          <InfoRow label="Official Phone" value={formData.step3?.officialPhone} />
          <InfoRow label="Official Email" value={formData.step3?.officialEmail} />
          <InfoRow label="Address" value={formData.step3?.fullAddress} />
          <InfoRow label="Area/Locality" value={formData.step3?.area} />
          <InfoRow label="Landmark" value={formData.step3?.landmark} />
          <InfoRow label="City" value={formData.step3?.city} />
          <InfoRow label="State" value={formData.step3?.state} />
          <InfoRow label="PIN Code" value={formData.step3?.pincode} />
        </SectionCard>

        {/* Step 4: Courses */}
        <SectionCard step={4} title="Courses / Programs" icon={BookOpen}>
          {formData.step4?.courses && formData.step4.courses.length > 0 ? (
            <div className="space-y-4">
              {formData.step4.courses.map((course: any, idx: number) => (
                <div key={idx} className="p-4 bg-night-900 rounded-lg">
                  <h4 className="font-semibold text-cream-100 mb-2">{course.courseName}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Category" value={course.category} />
                    <InfoRow label="Duration" value={`${course.duration} ${course.durationType}`} />
                    <InfoRow label="Mode" value={course.mode} />
                    <InfoRow label="Level" value={course.level} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream-100/60 text-sm">No courses added</p>
          )}
        </SectionCard>

        {/* Step 5: Batches */}
        <SectionCard step={5} title="Batches & Schedule" icon={Calendar}>
          {formData.step5?.batches && formData.step5.batches.length > 0 ? (
            <div className="space-y-4">
              {formData.step5.batches.map((batch: any, idx: number) => (
                <div key={idx} className="p-4 bg-night-900 rounded-lg">
                  <h4 className="font-semibold text-cream-100 mb-2">{batch.batchName}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Course" value={batch.courseName} />
                    <InfoRow label="Start Date" value={batch.startDate} />
                    <InfoRow label="Schedule" value={batch.scheduleType} />
                    <InfoRow label="Timing" value={batch.classTiming} />
                    <InfoRow label="Seats Available" value={batch.seatsAvailable} />
                    <InfoRow label="Mode" value={batch.mode} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream-100/60 text-sm">No batches added</p>
          )}
        </SectionCard>

        {/* Step 6: Learning Experience */}
        <SectionCard step={6} title="Learning Experience" icon={BookOpen}>
          {formData.step6 && Object.keys(formData.step6).length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(formData.step6).map(([key, value]: [string, any]) => {
                if (value === true) {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-cream-100 text-sm">{label}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : (
            <p className="text-cream-100/60 text-sm">No learning features selected</p>
          )}
        </SectionCard>

        {/* Step 7: Facilities */}
        <SectionCard step={7} title="Facilities" icon={Award}>
          {formData.step7?.facilities && formData.step7.facilities.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {formData.step7.facilities.map((facility: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-cream-100 text-sm">{facility}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream-100/60 text-sm">No facilities selected</p>
          )}
        </SectionCard>

        {/* Step 8: Faculty */}
        <SectionCard step={8} title="Faculty / Trainers" icon={Users}>
          <InfoRow label="Total Faculty" value={formData.step8?.totalFaculty} />
          <InfoRow label="Trainer-Student Ratio" value={formData.step8?.trainerStudentRatio} />
          <InfoRow label="Teaching Method" value={formData.step8?.teachingMethod} />
          {formData.step8?.trainers && formData.step8.trainers.length > 0 && (
            <div className="mt-4">
              <span className="text-cream-100/60 text-sm block mb-2">Trainers:</span>
              <div className="space-y-3">
                {formData.step8.trainers.map((trainer: any, idx: number) => (
                  <div key={idx} className="p-3 bg-night-900 rounded-lg">
                    <h5 className="font-semibold text-cream-100 text-sm">{trainer.name}</h5>
                    <p className="text-cream-100/60 text-xs mt-1">{trainer.qualification}</p>
                    <p className="text-cream-100/60 text-xs">{trainer.experience} experience</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Step 9: Fees */}
        <SectionCard step={9} title="Fees & Scholarships" icon={DollarSign}>
          <InfoRow label="Registration Fee" value={formData.step9?.registrationFee} />
          <InfoRow label="Admission Fee" value={formData.step9?.admissionFee} />
          <InfoRow label="Course Fee" value={formData.step9?.courseFee} />
          <InfoRow label="Monthly Fee" value={formData.step9?.monthlyFee} />
          <InfoRow label="Total Payable" value={formData.step9?.totalPayableAmount} />
          <InfoRow label="Scholarship Available" value={formData.step9?.scholarshipAvailable} />
          <InfoRow label="Installment Available" value={formData.step9?.installmentAvailable} />
        </SectionCard>

        {/* Step 10: Admission */}
        <SectionCard step={10} title="Admission / Enrollment" icon={Briefcase}>
          <InfoRow label="Admission Type" value={formData.step10?.admissionType} />
          <InfoRow label="Admission Process" value={formData.step10?.admissionProcess} />
          <InfoRow label="Start Date" value={formData.step10?.admissionStartDate} />
          <InfoRow label="End Date" value={formData.step10?.admissionEndDate} />
          <InfoRow label="Next Batch Start" value={formData.step10?.nextBatchStartDate} />
          <InfoRow label="Walk-in Available" value={formData.step10?.walkInAvailable} />
          <InfoRow label="Demo Available" value={formData.step10?.demoAvailable} />
        </SectionCard>

        {/* Step 11: Career */}
        <SectionCard step={11} title="Career & Outcomes" icon={Briefcase}>
          <InfoRow label="Placement Assistance" value={formData.step11?.placementAssistance} />
          <InfoRow label="Job Assistance" value={formData.step11?.jobAssistance} />
          <InfoRow label="Internship Assistance" value={formData.step11?.internshipAssistance} />
          <InfoRow label="Average Package" value={formData.step11?.averagePackage} />
          <InfoRow label="Highest Package" value={formData.step11?.highestPackage} />
          <InfoRow label="Placement Rate" value={formData.step11?.placementRate ? `${formData.step11.placementRate}%` : undefined} />
        </SectionCard>

        {/* Step 12: Results */}
        <SectionCard step={12} title="Results & Achievements" icon={Trophy}>
          {formData.step12?.results && formData.step12.results.length > 0 ? (
            <div className="space-y-3">
              {formData.step12.results.map((result: any, idx: number) => (
                <div key={idx} className="p-3 bg-night-900 rounded-lg">
                  <h5 className="font-semibold text-cream-100 text-sm">{result.exam} - {result.year}</h5>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <InfoRow label="Appeared" value={result.studentsAppeared} />
                    <InfoRow label="Qualified" value={result.qualified} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream-100/60 text-sm">No results added</p>
          )}
        </SectionCard>

        {/* Step 13: Gallery */}
        <SectionCard step={13} title="Gallery & Online Presence" icon={ImageIcon}>
          {formData.step13?.galleryPreviews && formData.step13.galleryPreviews.length > 0 && (
            <div>
              <span className="text-cream-100/60 text-sm block mb-2">Gallery Images:</span>
              <div className="grid grid-cols-4 gap-2">
                {formData.step13.galleryPreviews.slice(0, 8).map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-night-700"
                  />
                ))}
              </div>
            </div>
          )}
          <InfoRow label="Website" value={formData.step13?.website} />
          <InfoRow label="Instagram" value={formData.step13?.instagram} />
          <InfoRow label="Facebook" value={formData.step13?.facebook} />
          <InfoRow label="YouTube" value={formData.step13?.youtube} />
        </SectionCard>

        {/* Step 14: Verification */}
        <SectionCard step={14} title="Verification Documents" icon={Shield}>
          <InfoRow label="Representative Name" value={formData.step14?.ownerName} />
          <InfoRow label="Designation" value={formData.step14?.designation} />
          <div>
            <span className="text-cream-100/60 text-sm block mb-1">Government ID:</span>
            <span className="text-cream-100 text-sm">
              {formData.step14?.idProofPreview ? 'Uploaded ✓' : 'Not uploaded'}
            </span>
          </div>
          <div>
            <span className="text-cream-100/60 text-sm block mb-1">Registration Document:</span>
            <span className="text-cream-100 text-sm">
              {formData.step14?.registrationDocPreview ? 'Uploaded ✓' : 'Not uploaded'}
            </span>
          </div>
        </SectionCard>
      </div>

      {/* Submission Section */}
      {requiredStatus.isReady && (
        <div className="bg-night-800 border border-night-700 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-cream-100 mb-4">Ready to Submit</h3>
          <p className="text-cream-100/70 mb-6">
            Your institute registration is complete. By submitting, your institute will be sent
            for verification by the EasyToFindEdu admin team.
          </p>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-night-600 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-cream-100/80 text-sm">
              I confirm that the information provided is accurate and belongs to this institute.
              I understand that false information may result in rejection or removal from the platform.
            </span>
          </label>

          <button
            onClick={onSubmit}
            disabled={!agreedToTerms || loading}
            className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
              agreedToTerms && !loading
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-night-900 hover:shadow-goldGlow'
                : 'bg-night-700 text-cream-100/40 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewAndSubmit;
