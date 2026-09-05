import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

interface Step1Props {
  data?: any;
  onNext: (data: any) => void;
  onSaveDraft: (data: any) => void;
  loading: boolean;
}

const INSTITUTE_TYPES = [
  'Coaching Institute',
  'Training Center',
  'Academy',
  'School',
  'College',
  'University',
  'Other'
];

const OWNERSHIP_TYPES = [
  'Individual',
  'Partnership',
  'Private Limited',
  'Public Limited',
  'Trust',
  'Society',
  'Other'
];

export default function Step1InstituteInfo({ data, onNext, onSaveDraft, loading }: Step1Props) {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    instituteType: data?.instituteType || '',
    description: data?.description || '',
    detailedAbout: data?.detailedAbout || '',
    establishedYear: data?.establishedYear || '',
    ownershipType: data?.ownershipType || '',
    numberOfBranches: data?.numberOfBranches || 1,
    logoFile: data?.logoFile || '',
    coverImageFile: data?.coverImageFile || '',
    logoPreview: data?.logoPreview || '',
    coverImagePreview: data?.coverImagePreview || ''
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev: any) => ({
          ...prev,
          [type]: 'File size must be less than 5MB'
        }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev: any) => ({
          ...prev,
          [type]: 'Only image files are allowed'
        }));
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      // Set preview immediately for better UX
      if (type === 'logo') {
        setFormData(prev => ({
          ...prev,
          logoPreview: previewUrl
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          coverImagePreview: previewUrl
        }));
      }

      // Clear error
      if (errors[type]) {
        setErrors((prev: any) => ({ ...prev, [type]: '' }));
      }

      // Upload file immediately to get URL
      await uploadFile(file, type);
    }
  };

  const uploadFile = async (file: File, type: 'logo' | 'coverImage') => {
    try {
      const token = localStorage.getItem('etf_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stepNumber', '1');
      formData.append('fieldName', type === 'logo' ? 'logoFile' : 'coverImageFile');

      const response = await fetch('https://easytofindedu.onrender.com/api/v1/institute/draft/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Store the URL in formData
      if (type === 'logo') {
        setFormData(prev => ({
          ...prev,
          logoFile: result.data.url
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          coverImageFile: result.data.url
        }));
      }
    } catch (error) {
      console.error('File upload error:', error);
      setErrors((prev: any) => ({
        ...prev,
        [type]: 'Failed to upload file. Please try again.'
      }));
    }
  };

  const removeFile = (type: 'logo' | 'coverImage') => {
    if (type === 'logo') {
      setFormData(prev => ({
        ...prev,
        logoFile: '',
        logoPreview: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        coverImageFile: '',
        coverImagePreview: ''
      }));
    }
  };

  const validate = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Institute name is required';
    }

    if (!formData.instituteType) {
      newErrors.instituteType = 'Institute type is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Short description is required';
    } else if (formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }

    if (!formData.logoPreview && !formData.logoFile) {
      newErrors.logo = 'Institute logo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  const handleSave = () => {
    onSaveDraft(formData);
  };

  return (
    <div className="bg-night-800 border border-night-700 p-8 rounded-lg shadow-2xl">
      <h2 className="font-display text-3xl text-cream-100 mb-2">Institute Information</h2>
      <p className="text-cream-100/60 mb-8">Let's start with basic details about your institute</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institute Name */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Institute Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="E.g., Brilliant Academy, Tech Training Center"
            className={`w-full px-4 py-3 bg-night-900 border rounded-lg text-cream-100 placeholder:text-cream-100/40 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all ${
              errors.name ? 'border-red-500' : 'border-night-700'
            }`}
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Institute Type */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Institute Type <span className="text-red-400">*</span>
          </label>
          <select
            name="instituteType"
            value={formData.instituteType}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-night-900 border rounded-lg text-cream-100 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all ${
              errors.instituteType ? 'border-red-500' : 'border-night-700'
            }`}
          >
            <option value="">Select Type</option>
            {INSTITUTE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.instituteType && <p className="text-red-400 text-sm mt-1">{errors.instituteType}</p>}
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Short Description <span className="text-red-400">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            maxLength={200}
            placeholder="Brief description of your institute (max 200 characters)"
            className={`w-full px-4 py-3 bg-night-900 border rounded-lg text-cream-100 placeholder:text-cream-100/40 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all ${
              errors.description ? 'border-red-500' : 'border-night-700'
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
            <p className="text-cream-100/50 text-sm ml-auto">{formData.description.length}/200</p>
          </div>
        </div>

        {/* Detailed About */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Detailed About
          </label>
          <textarea
            name="detailedAbout"
            value={formData.detailedAbout}
            onChange={handleChange}
            rows={5}
            placeholder="Provide detailed information about your institute..."
            className="w-full px-4 py-3 bg-night-900 border border-night-700 rounded-lg text-cream-100 placeholder:text-cream-100/40 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
          />
        </div>

        {/* Established Year */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Established Year
          </label>
          <input
            type="number"
            name="establishedYear"
            value={formData.establishedYear}
            onChange={handleChange}
            min="1900"
            max={new Date().getFullYear()}
            placeholder={new Date().getFullYear().toString()}
            className="w-full px-4 py-3 bg-night-900 border border-night-700 rounded-lg text-cream-100 placeholder:text-cream-100/40 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
          />
        </div>

        {/* Ownership Type */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Ownership Type
          </label>
          <select
            name="ownershipType"
            value={formData.ownershipType}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-night-900 border border-night-700 rounded-lg text-cream-100 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
          >
            <option value="">Select Ownership Type</option>
            {OWNERSHIP_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Number of Branches */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Number of Branches
          </label>
          <input
            type="number"
            name="numberOfBranches"
            value={formData.numberOfBranches}
            onChange={handleChange}
            min="1"
            placeholder="Enter number of branches"
            className="w-full px-4 py-3 bg-night-900 border border-night-700 rounded-lg text-cream-100 placeholder:text-cream-100/40 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
          />
        </div>

        {/* Institute Logo */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Institute Logo <span className="text-red-400">*</span>
          </label>
          <div className="mt-2">
            {formData.logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={formData.logoPreview}
                  alt="Logo preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gold-500/30"
                />
                <button
                  type="button"
                  onClick={() => removeFile('logo')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-night-700 border-dashed rounded-lg cursor-pointer hover:bg-night-900/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gold-400" />
                  <p className="text-sm text-cream-100">Click to upload logo</p>
                  <p className="text-xs text-cream-100/50">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {errors.logo && <p className="text-red-400 text-sm mt-1">{errors.logo}</p>}
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-semibold text-cream-100 mb-2">
            Cover Image
          </label>
          <div className="mt-2">
            {formData.coverImagePreview ? (
              <div className="relative inline-block w-full">
                <img
                  src={formData.coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gold-500/30"
                />
                <button
                  type="button"
                  onClick={() => removeFile('coverImage')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-night-700 border-dashed rounded-lg cursor-pointer hover:bg-night-900/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gold-400" />
                  <p className="text-sm text-cream-100">Click to upload cover image</p>
                  <p className="text-xs text-cream-100/50">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'coverImage')}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {errors.coverImage && <p className="text-red-400 text-sm mt-1">{errors.coverImage}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 border border-night-700 text-cream-100 rounded-lg hover:bg-night-700 disabled:opacity-50 transition-all font-semibold"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gold-500 text-night-900 rounded-lg hover:bg-gold-400 disabled:opacity-50 transition-all font-bold shadow-goldGlow"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
