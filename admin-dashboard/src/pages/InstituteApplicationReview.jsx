import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/instituteApplicationService.js';
import StatusBadge from '../components/instituteApplications/StatusBadge.jsx';

export default function InstituteApplicationReview({ token, applicationId, onBack }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Action modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.getApplicationById(token, applicationId);

      if (response.success) {
        setApplication(response.data);
      } else {
        setError(response.message || 'Failed to load application');
      }
    } catch (err) {
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setError('');

      const response = await api.approveApplication(token, applicationId);

      if (response.success) {
        alert('Application approved successfully');
        await loadApplication();
        setShowApproveModal(false);
      } else {
        setError(response.message || 'Failed to approve application');
      }
    } catch (err) {
      setError(err.message || 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      setError('Feedback is required');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await api.requestChanges(token, applicationId, feedback);

      if (response.success) {
        alert('Changes requested successfully');
        await loadApplication();
        setShowChangesModal(false);
        setFeedback('');
      } else {
        setError(response.message || 'Failed to request changes');
      }
    } catch (err) {
      setError(err.message || 'Failed to request changes');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await api.rejectApplication(token, applicationId, reason);

      if (response.success) {
        alert('Application rejected successfully');
        await loadApplication();
        setShowRejectModal(false);
        setReason('');
      } else {
        setError(response.message || 'Failed to reject application');
      }
    } catch (err) {
      setError(err.message || 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) {
      setError('Suspension reason is required');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await api.suspendApplication(token, applicationId, reason);

      if (response.success) {
        alert('Institute suspended successfully');
        await loadApplication();
        setShowSuspendModal(false);
        setReason('');
      } else {
        setError(response.message || 'Failed to suspend institute');
      }
    } catch (err) {
      setError(err.message || 'Failed to suspend institute');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-ink-400">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-lg text-wine mb-4">Application not found</p>
          <button
            onClick={onBack}
            className="px-6 py-2 border border-cream-300 text-sm uppercase tracking-wide text-night-800 hover:bg-cream-50"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const step1 = application.step1InstituteInfo || {};
  const step2 = application.step2Category || {};
  const step3 = application.step3LocationContact || {};
  const step4 = application.step4Courses || {};
  const step5 = application.step5Batches || {};
  const step6 = application.step6LearningExperience || {};
  const step7 = application.step7Facilities || {};
  const step8 = application.step8Faculty || {};
  const step9 = application.step9Fees || {};
  const step10 = application.step10Admission || {};
  const step11 = application.step11Career || {};
  const step12 = application.step12Results || {};
  const step13 = application.step13Gallery || {};
  const step14 = application.step14Verification || {};

  const status = application.verificationStatus || application.status;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-gold-600 hover:text-gold-700 mb-2 flex items-center gap-2"
          >
            ← Back to Applications
          </button>
          <h1 className="font-display text-[32px] text-night-800 mb-2">
            {step1.instituteName || 'Unnamed Institute'}
          </h1>
          <div className="flex items-center gap-4">
            <StatusBadge status={status} />
            <span className="text-sm text-ink-400">
              Owner: {application.ownerId?.name || 'N/A'} ({application.ownerId?.email || 'N/A'})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {status === 'verified' && (
            <button
              onClick={() => setShowSuspendModal(true)}
              className="px-6 py-2 bg-gray-600 text-white text-xs uppercase tracking-wide hover:bg-gray-700"
            >
              Suspend
            </button>
          )}
          {(status === 'submitted' || status === 'under_review' || status === 'changes_requested') && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-6 py-2 bg-wine text-white text-xs uppercase tracking-wide hover:bg-wine/90"
              >
                Reject
              </button>
              <button
                onClick={() => setShowChangesModal(true)}
                className="px-6 py-2 bg-orange-500 text-white text-xs uppercase tracking-wide hover:bg-orange-600"
              >
                Request Changes
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-6 py-2 bg-green-600 text-white text-xs uppercase tracking-wide hover:bg-green-700"
              >
                Approve & Publish
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 border-l-2 border-wine bg-cream-200 px-5 py-3 text-sm text-wine"
        >
          {error}
        </motion.div>
      )}

      {/* Admin Feedback Display */}
      {application.adminFeedback && (
        <div className="mb-6 bg-orange-50 border border-orange-200 p-4">
          <p className="text-[11px] uppercase tracking-overline text-orange-600 mb-2">Admin Feedback</p>
          <p className="text-sm text-orange-900">{application.adminFeedback}</p>
        </div>
      )}

      {/* Application Steps */}
      <div className="space-y-4">
        {/* Step 1 */}
        <StepSection
          title="Step 1: Institute Information"
          expanded={expandedSections['step1']}
          onToggle={() => toggleSection('step1')}
        >
          <InfoRow label="Institute Name" value={step1.instituteName} />
          <InfoRow label="Description" value={step1.description} />
          <InfoRow label="Established Year" value={step1.establishedYear} />
          <InfoRow label="Registration Year" value={step1.registrationYear} />
          {step1.logoFile && <InfoRow label="Logo" value={<a href={step1.logoFile} target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline">View Logo</a>} />}
          {step1.coverImageFile && <InfoRow label="Cover Image" value={<a href={step1.coverImageFile} target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline">View Cover</a>} />}
        </StepSection>

        {/* Step 2 */}
        <StepSection
          title="Step 2: Category & Subcategory"
          expanded={expandedSections['step2']}
          onToggle={() => toggleSection('step2')}
        >
          <InfoRow label="Primary Category" value={step2.primaryCategory} />
          <InfoRow label="Subcategories" value={step2.subcategories?.join(', ')} />
        </StepSection>

        {/* Step 3 */}
        <StepSection
          title="Step 3: Location & Contact"
          expanded={expandedSections['step3']}
          onToggle={() => toggleSection('step3')}
        >
          <InfoRow label="Full Address" value={step3.fullAddress} />
          <InfoRow label="City" value={step3.city} />
          <InfoRow label="State" value={step3.state} />
          <InfoRow label="Pincode" value={step3.pincode} />
          <InfoRow label="Email" value={step3.email} />
          <InfoRow label="Phone" value={step3.phone} />
          <InfoRow label="Website" value={step3.website} />
        </StepSection>

        {/* Step 4 */}
        <StepSection
          title="Step 4: Courses"
          expanded={expandedSections['step4']}
          onToggle={() => toggleSection('step4')}
        >
          {step4.courses?.length > 0 ? (
            <div className="space-y-2">
              {step4.courses.map((course, idx) => (
                <div key={idx} className="bg-cream-50 p-3 border border-cream-200">
                  <p className="font-medium text-sm text-night-800">{course.courseName}</p>
                  <p className="text-xs text-ink-500">Duration: {course.duration} {course.durationType}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">No courses added</p>
          )}
        </StepSection>

        {/* Step 5 */}
        <StepSection
          title="Step 5: Batches"
          expanded={expandedSections['step5']}
          onToggle={() => toggleSection('step5')}
        >
          {step5.batches?.length > 0 ? (
            <div className="space-y-2">
              {step5.batches.map((batch, idx) => (
                <div key={idx} className="bg-cream-50 p-3 border border-cream-200">
                  <p className="font-medium text-sm text-night-800">{batch.batchName}</p>
                  <p className="text-xs text-ink-500">Timing: {batch.timing}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">No batches added</p>
          )}
        </StepSection>

        {/* Step 6 */}
        <StepSection
          title="Step 6: Learning Experience"
          expanded={expandedSections['step6']}
          onToggle={() => toggleSection('step6')}
        >
          <InfoRow label="Teaching Method" value={step6.teachingMethod} />
          <InfoRow label="Class Size" value={step6.classSize} />
        </StepSection>

        {/* Step 7 */}
        <StepSection
          title="Step 7: Facilities"
          expanded={expandedSections['step7']}
          onToggle={() => toggleSection('step7')}
        >
          {step7.facilities?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {step7.facilities.map((facility, idx) => (
                <span key={idx} className="px-3 py-1 bg-cream-100 border border-cream-300 text-xs text-night-800">
                  {facility}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">No facilities listed</p>
          )}
        </StepSection>

        {/* Step 8 */}
        <StepSection
          title="Step 8: Faculty"
          expanded={expandedSections['step8']}
          onToggle={() => toggleSection('step8')}
        >
          <InfoRow label="Total Faculty" value={step8.totalFaculty} />
          <InfoRow label="Qualified Faculty" value={step8.qualifiedFaculty} />
        </StepSection>

        {/* Step 9 */}
        <StepSection
          title="Step 9: Fees & Scholarships"
          expanded={expandedSections['step9']}
          onToggle={() => toggleSection('step9')}
        >
          <InfoRow label="Course Fee" value={step9.courseFee} />
          <InfoRow label="Total Payable Amount" value={step9.totalPayableAmount} />
        </StepSection>

        {/* Step 10 */}
        <StepSection
          title="Step 10: Admission / Enrollment"
          expanded={expandedSections['step10']}
          onToggle={() => toggleSection('step10')}
        >
          <InfoRow label="Admission Type" value={step10.admissionType} />
          <InfoRow label="Eligibility" value={step10.eligibility} />
        </StepSection>

        {/* Step 11 */}
        <StepSection
          title="Step 11: Career & Outcomes"
          expanded={expandedSections['step11']}
          onToggle={() => toggleSection('step11')}
        >
          <InfoRow label="Placement Support" value={step11.placementSupport ? 'Yes' : 'No'} />
          <InfoRow label="Career Guidance" value={step11.careerGuidance ? 'Yes' : 'No'} />
        </StepSection>

        {/* Step 12 */}
        <StepSection
          title="Step 12: Results & Achievements"
          expanded={expandedSections['step12']}
          onToggle={() => toggleSection('step12')}
        >
          <InfoRow label="Success Rate" value={step12.successRate} />
          <InfoRow label="Awards" value={step12.awards} />
        </StepSection>

        {/* Step 13 */}
        <StepSection
          title="Step 13: Gallery & Online Presence"
          expanded={expandedSections['step13']}
          onToggle={() => toggleSection('step13')}
        >
          <InfoRow label="Website" value={step13.website} />
          <InfoRow label="Facebook" value={step13.facebook} />
          <InfoRow label="Instagram" value={step13.instagram} />
        </StepSection>

        {/* Step 14 - PRIVATE VERIFICATION DOCUMENTS */}
        <StepSection
          title="Step 14: Verification Documents (Admin Only)"
          expanded={expandedSections['step14']}
          onToggle={() => toggleSection('step14')}
        >
          <div className="bg-amber-50 border border-amber-200 p-3 mb-4">
            <p className="text-xs text-amber-800">⚠️ These documents are private and must not be exposed publicly</p>
          </div>
          <InfoRow label="Owner Name" value={step14.ownerName} />
          <InfoRow label="Designation" value={step14.designation} />
          {step14.idProofFile && <InfoRow label="ID Proof" value={<a href={step14.idProofFile} target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline">View Document</a>} />}
          {step14.registrationDocFile && <InfoRow label="Registration Document" value={<a href={step14.registrationDocFile} target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline">View Document</a>} />}
          <InfoRow label="GST Number" value={step14.gstNumber} />
          <InfoRow label="PAN Number" value={step14.panNumber} />
          <InfoRow label="License Number" value={step14.licenseNumber} />
        </StepSection>
      </div>

      {/* Modals */}
      <ActionModal
        show={showApproveModal}
        title="Approve Application"
        message="Are you sure you want to approve and publish this institute?"
        confirmText="Approve & Publish"
        confirmColor="green"
        onConfirm={handleApprove}
        onCancel={() => setShowApproveModal(false)}
        processing={processing}
      />

      <FeedbackModal
        show={showChangesModal}
        title="Request Changes"
        label="Feedback to Institute Owner"
        placeholder="Please provide detailed feedback on what needs to be changed..."
        value={feedback}
        onChange={setFeedback}
        confirmText="Request Changes"
        onConfirm={handleRequestChanges}
        onCancel={() => {
          setShowChangesModal(false);
          setFeedback('');
        }}
        processing={processing}
      />

      <FeedbackModal
        show={showRejectModal}
        title="Reject Application"
        label="Rejection Reason"
        placeholder="Please provide a reason for rejection..."
        value={reason}
        onChange={setReason}
        confirmText="Reject Application"
        confirmColor="wine"
        onConfirm={handleReject}
        onCancel={() => {
          setShowRejectModal(false);
          setReason('');
        }}
        processing={processing}
      />

      <FeedbackModal
        show={showSuspendModal}
        title="Suspend Institute"
        label="Suspension Reason"
        placeholder="Please provide a reason for suspension..."
        value={reason}
        onChange={setReason}
        confirmText="Suspend Institute"
        confirmColor="gray"
        onConfirm={handleSuspend}
        onCancel={() => {
          setShowSuspendModal(false);
          setReason('');
        }}
        processing={processing}
      />
    </div>
  );
}

// Helper Components
function StepSection({ title, expanded, onToggle, children }) {
  return (
    <div className="bg-white border border-cream-300">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-cream-50"
      >
        <span className="text-sm font-medium text-night-800">{title}</span>
        <span className="text-gold-600">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="px-6 py-4 border-t border-cream-200">
          {children}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="py-2 flex">
      <span className="text-xs text-ink-500 w-48">{label}</span>
      <span className="text-sm text-night-800 flex-1">{value || 'N/A'}</span>
    </div>
  );
}

function ActionModal({ show, title, message, confirmText, confirmColor = 'gold', onConfirm, onCancel, processing }) {
  if (!show) return null;

  const colorClasses = {
    gold: 'bg-gold-500 hover:bg-gold-600',
    green: 'bg-green-600 hover:bg-green-700',
    wine: 'bg-wine hover:bg-wine/90',
    gray: 'bg-gray-600 hover:bg-gray-700'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-cream-300 p-8 max-w-md w-full mx-4"
      >
        <h3 className="text-xl font-display text-night-800 mb-4">{title}</h3>
        <p className="text-sm text-ink-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-6 py-2 border border-cream-300 text-xs uppercase tracking-wide text-night-800 hover:bg-cream-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className={`px-6 py-2 text-white text-xs uppercase tracking-wide ${colorClasses[confirmColor]} disabled:opacity-50`}
          >
            {processing ? 'Processing...' : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FeedbackModal({ show, title, label, placeholder, value, onChange, confirmText, confirmColor = 'gold', onConfirm, onCancel, processing }) {
  if (!show) return null;

  const colorClasses = {
    gold: 'bg-gold-500 hover:bg-gold-600',
    wine: 'bg-wine hover:bg-wine/90',
    gray: 'bg-gray-600 hover:bg-gray-700'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-cream-300 p-8 max-w-lg w-full mx-4"
      >
        <h3 className="text-xl font-display text-night-800 mb-4">{title}</h3>
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-overline text-gold-600 mb-2">
            {label}
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={5}
            className="w-full border border-cream-300 bg-white px-4 py-3 text-sm text-night-800 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-6 py-2 border border-cream-300 text-xs uppercase tracking-wide text-night-800 hover:bg-cream-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className={`px-6 py-2 text-white text-xs uppercase tracking-wide ${colorClasses[confirmColor]} disabled:opacity-50`}
          >
            {processing ? 'Processing...' : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
