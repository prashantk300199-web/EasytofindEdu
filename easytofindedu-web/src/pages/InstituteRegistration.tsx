import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Step1InstituteInfo from '../components/institute-registration/Step1InstituteInfo';
import Step2Category from '../components/institute-registration/Step2Category';
import Step3LocationContact from '../components/institute-registration/Step3LocationContact';
import Step4Courses from '../components/institute-registration/Step4Courses';
import Step5Batches from '../components/institute-registration/Step5Batches';
import Step6LearningExperience from '../components/institute-registration/Step6LearningExperience';
import Step7Facilities from '../components/institute-registration/Step7Facilities';
import Step8Faculty from '../components/institute-registration/Step8Faculty';
import Step9FeesScholarships from '../components/institute-registration/Step9FeesScholarships';
import Step10Admission from '../components/institute-registration/Step10Admission';
import Step11Career from '../components/institute-registration/Step11Career';
import Step12Results from '../components/institute-registration/Step12Results';
import Step13Gallery from '../components/institute-registration/Step13Gallery';
import Step14Verification from '../components/institute-registration/Step14Verification';
import ReviewAndSubmit from '../components/institute-registration/ReviewAndSubmit';

const TOTAL_STEPS = 14;
const REVIEW_STEP = 15;

// Map step numbers to backend field names
const getStepFieldName = (step: number): string => {
  const fieldNames: { [key: number]: string } = {
    1: 'InstituteInfo',
    2: 'Category',
    3: 'LocationContact',
    4: 'Courses',
    5: 'Batches',
    6: 'LearningExperience',
    7: 'Facilities',
    8: 'Faculty',
    9: 'Fees',
    10: 'Admission',
    11: 'Career',
    12: 'Results',
    13: 'Gallery',
    14: 'Verification'
  };
  return fieldNames[step] || '';
};

interface DraftData {
  step1?: any;
  step2?: any;
  step3?: any;
  step4?: any;
  step5?: any;
  step6?: any;
  step7?: any;
  step8?: any;
  step9?: any;
  step10?: any;
  step11?: any;
  step12?: any;
  step13?: any;
  step14?: any;
  lastSaved?: string;
}

export default function InstituteRegistration() {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DraftData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    if (user?.role === 'institute_owner') {
      loadDraft();
    }
  }, [user]);

  const loadDraft = async () => {
    try {
      const token = getToken();
      const res = await fetch('https://easytofindedu.onrender.com/api/v1/institute/draft', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setFormData(data.data.draftData || {});
          setCurrentStep(data.data.currentStep || 1);
        }
      }
    } catch (err) {
      console.log('No existing draft found');
    }
  };

  const saveDraft = async (step: number, stepData: any) => {
    setSaving(true);
    setError(null);
    try {
      const token = getToken();

      // Build the payload matching backend expectations
      const payload: any = {
        currentStep: step,
        [`step${step}${getStepFieldName(step)}`]: stepData
      };

      const res = await fetch('https://easytofindedu.onrender.com/api/v1/institute/draft/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save draft');
      }

      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        [`step${step}`]: stepData
      }));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (stepData: any) => {
    try {
      await saveDraft(currentStep, stepData);
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
      } else if (currentStep === TOTAL_STEPS) {
        // After step 14, go to review
        setCurrentStep(REVIEW_STEP);
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('Failed to save and proceed:', err);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleDataChange = (data: any) => {
    setFormData(prev => ({
      ...prev,
      [`step${currentStep}`]: data
    }));
  };

  const handleSaveDraft = async (stepData: any) => {
    try {
      await saveDraft(currentStep, stepData);
      alert('Draft saved successfully!');
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleEditFromReview = (step: number) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  const handleSubmitForVerification = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = getToken();
      const res = await fetch('https://easytofindedu.onrender.com/api/v1/owner/institutes/draft/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit institute');
      }

      const data = await res.json();

      // Show success message
      alert('Institute submitted successfully! Your institute will be reviewed by our team.');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'institute_owner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-900">
        <div className="text-center">
          <h2 className="font-display text-3xl text-cream-100 mb-4">Access Denied</h2>
          <p className="text-cream-100/60 mb-6">Only institute owners can register institutes.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-gold-500 text-night-900 font-semibold rounded-lg hover:bg-gold-400 transition-all duration-300 shadow-goldGlow"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-display text-5xl md:text-6xl text-cream-100 mb-4">Register Your Institute</h1>
          <p className="text-cream-100/60 text-lg">Complete all steps to list your institute on our platform</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gold-400 uppercase tracking-wide">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm text-cream-100/70">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-night-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-gold-500 to-gold-400 h-2 rounded-full shadow-goldGlow"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Navigation Pills */}
        <div className="mb-10 flex flex-wrap gap-3 justify-center">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                currentStep === step
                  ? 'bg-gold-500 text-night-900 shadow-goldGlow'
                  : step < currentStep
                  ? 'bg-night-700 text-gold-400 border border-gold-500/30 hover:border-gold-500/50'
                  : 'bg-night-800 text-cream-100/60 border border-night-700 hover:bg-night-750 hover:text-cream-100'
              }`}
            >
              Step {step}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-5 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Saving Indicator */}
        {saving && (
          <div className="mb-6 p-5 bg-gold-900/20 border border-gold-500/30 rounded-lg backdrop-blur-sm">
            <p className="text-gold-400 font-medium">Saving draft...</p>
          </div>
        )}

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <Step1InstituteInfo
              data={formData.step1}
              onNext={handleNext}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 2 && (
            <Step2Category
              data={formData.step2}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 3 && (
            <Step3LocationContact
              data={formData.step3}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 4 && (
            <Step4Courses
              data={formData.step4}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 5 && (
            <Step5Batches
              data={formData.step5}
              coursesData={formData.step4}
              onChange={handleDataChange}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 6 && (
            <Step6LearningExperience
              data={formData.step6}
              onChange={handleDataChange}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 7 && (
            <Step7Facilities
              data={formData.step7}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 8 && (
            <Step8Faculty
              data={formData.step8}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 9 && (
            <Step9FeesScholarships
              data={formData.step9}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 10 && (
            <Step10Admission
              data={formData.step10}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 11 && (
            <Step11Career
              data={formData.step11}
              onChange={(data) => setFormData({ ...formData, step11: data })}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 12 && (
            <Step12Results
              data={formData.step12}
              onChange={handleDataChange}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 13 && (
            <Step13Gallery
              data={formData.step13}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === 14 && (
            <Step14Verification
              data={formData.step14}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              loading={saving}
            />
          )}
          {currentStep === REVIEW_STEP && (
            <ReviewAndSubmit
              formData={formData}
              onEdit={handleEditFromReview}
              onSubmit={handleSubmitForVerification}
              loading={saving}
            />
          )}
          {currentStep > REVIEW_STEP && (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <h3 className="text-xl font-semibold mb-4">Step {currentStep} - Coming Soon</h3>
              <p className="text-gray-600 mb-6">This step is under development.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext({})}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
