/**
 * Category-Specific Dynamic Fields Configuration
 *
 * This configuration drives the dynamic field system for institute registration.
 * Add new categories or fields here without changing core registration logic.
 */

export const categoryFieldsConfig = {
  academic: {
    label: 'Academic / Coaching',
    subcategories: {
      neet: {
        label: 'NEET Coaching',
        fields: [
          { key: 'targetExam', label: 'Target Exam', type: 'select', options: ['NEET UG', 'NEET PG', 'AIIMS', 'JIPMER'], required: true },
          { key: 'targetYear', label: 'Target Year', type: 'select', options: ['2026', '2027', '2028', '2029'], required: true },
          { key: 'batchType', label: 'Batch Type', type: 'multiselect', options: ['Regular', 'Crash Course', 'Fast Track', 'Weekend', 'Online', 'Hybrid'] },
          { key: 'testSeries', label: 'Test Series', type: 'toggle', required: true },
          { key: 'mockTests', label: 'Mock Tests', type: 'toggle', required: true },
          { key: 'studyMaterial', label: 'Study Material', type: 'toggle', required: true },
          { key: 'doubtSessions', label: 'Doubt Sessions', type: 'toggle', required: true },
          { key: 'performanceTracking', label: 'Performance Tracking', type: 'toggle', required: true }
        ]
      },
      jee: {
        label: 'JEE Coaching',
        fields: [
          { key: 'targetExam', label: 'Target Exam', type: 'select', options: ['JEE Main', 'JEE Advanced', 'Both'], required: true },
          { key: 'targetYear', label: 'Target Year', type: 'select', options: ['2026', '2027', '2028', '2029'], required: true },
          { key: 'batchType', label: 'Batch Type', type: 'multiselect', options: ['Regular', 'Crash Course', 'Fast Track', 'Weekend', 'Online', 'Hybrid'] },
          { key: 'testSeries', label: 'Test Series', type: 'toggle', required: true },
          { key: 'mockTests', label: 'Mock Tests', type: 'toggle', required: true },
          { key: 'studyMaterial', label: 'Study Material', type: 'toggle', required: true },
          { key: 'doubtSessions', label: 'Doubt Sessions', type: 'toggle', required: true },
          { key: 'performanceTracking', label: 'Performance Tracking', type: 'toggle', required: true }
        ]
      },
      coaching: {
        label: 'General Coaching',
        fields: [
          { key: 'targetExam', label: 'Target Exam', type: 'text', required: true },
          { key: 'targetYear', label: 'Target Year', type: 'select', options: ['2026', '2027', '2028', '2029'], required: true },
          { key: 'batchType', label: 'Batch Type', type: 'multiselect', options: ['Regular', 'Crash Course', 'Fast Track', 'Weekend', 'Online', 'Hybrid'] },
          { key: 'testSeries', label: 'Test Series', type: 'toggle', required: true },
          { key: 'mockTests', label: 'Mock Tests', type: 'toggle', required: true },
          { key: 'studyMaterial', label: 'Study Material', type: 'toggle', required: true },
          { key: 'doubtSessions', label: 'Doubt Sessions', type: 'toggle', required: true },
          { key: 'performanceTracking', label: 'Performance Tracking', type: 'toggle', required: true }
        ]
      }
    }
  },

  dance: {
    label: 'Dance',
    subcategories: {
      bharatanatyam: {
        label: 'Bharatanatyam',
        fields: [
          { key: 'danceStyle', label: 'Dance Style', type: 'text', required: true, defaultValue: 'Bharatanatyam' },
          { key: 'skillLevel', label: 'Skill Level', type: 'multiselect', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], required: true },
          { key: 'ageGroup', label: 'Age Group', type: 'multiselect', options: ['Kids (5-12)', 'Teens (13-17)', 'Adults (18+)', 'Seniors (50+)'], required: true },
          { key: 'classesPerWeek', label: 'Classes Per Week', type: 'number', required: true },
          { key: 'performanceOpportunities', label: 'Performance Opportunities', type: 'toggle', required: true },
          { key: 'competitionTraining', label: 'Competition Training', type: 'toggle', required: true },
          { key: 'classType', label: 'Class Type', type: 'multiselect', options: ['Private', 'Group', 'Semi-Private'] },
          { key: 'certification', label: 'Certification Available', type: 'toggle', required: true }
        ]
      },
      kathak: {
        label: 'Kathak',
        fields: [
          { key: 'danceStyle', label: 'Dance Style', type: 'text', required: true, defaultValue: 'Kathak' },
          { key: 'skillLevel', label: 'Skill Level', type: 'multiselect', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], required: true },
          { key: 'ageGroup', label: 'Age Group', type: 'multiselect', options: ['Kids (5-12)', 'Teens (13-17)', 'Adults (18+)', 'Seniors (50+)'], required: true },
          { key: 'classesPerWeek', label: 'Classes Per Week', type: 'number', required: true },
          { key: 'performanceOpportunities', label: 'Performance Opportunities', type: 'toggle', required: true },
          { key: 'competitionTraining', label: 'Competition Training', type: 'toggle', required: true },
          { key: 'classType', label: 'Class Type', type: 'multiselect', options: ['Private', 'Group', 'Semi-Private'] },
          { key: 'certification', label: 'Certification Available', type: 'toggle', required: true }
        ]
      },
      contemporary: {
        label: 'Contemporary Dance',
        fields: [
          { key: 'danceStyle', label: 'Dance Style', type: 'text', required: true, defaultValue: 'Contemporary' },
          { key: 'skillLevel', label: 'Skill Level', type: 'multiselect', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], required: true },
          { key: 'ageGroup', label: 'Age Group', type: 'multiselect', options: ['Kids (5-12)', 'Teens (13-17)', 'Adults (18+)', 'Seniors (50+)'], required: true },
          { key: 'classesPerWeek', label: 'Classes Per Week', type: 'number', required: true },
          { key: 'performanceOpportunities', label: 'Performance Opportunities', type: 'toggle', required: true },
          { key: 'competitionTraining', label: 'Competition Training', type: 'toggle', required: true },
          { key: 'classType', label: 'Class Type', type: 'multiselect', options: ['Private', 'Group', 'Semi-Private'] },
          { key: 'certification', label: 'Certification Available', type: 'toggle', required: true }
        ]
      }
    }
  },

  music: {
    label: 'Music',
    subcategories: {
      vocal: {
        label: 'Vocal Music',
        fields: [
          { key: 'instrumentVocalType', label: 'Vocal Type', type: 'select', options: ['Classical', 'Light', 'Semi-Classical', 'Devotional', 'Film Songs'], required: true },
          { key: 'musicStyle', label: 'Music Style', type: 'select', options: ['Hindustani', 'Carnatic', 'Western', 'Folk', 'Mixed'], required: true },
          { key: 'skillLevel', label: 'Skill Level', type: 'multiselect', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], required: true },
          { key: 'practiceRooms', label: 'Practice Rooms Available', type: 'toggle', required: true },
          { key: 'instrumentsProvided', label: 'Instruments Provided', type: 'toggle', required: true },
          { key: 'performanceOpportunities', label: 'Performance Opportunities', type: 'toggle', required: true },
          { key: 'recordingFacilities', label: 'Recording Facilities', type: 'toggle', required: true },
          { key: 'certification', label: 'Certification Available', type: 'toggle', required: true }
        ]
      },
      instrumental: {
        label: 'Instrumental Music',
        fields: [
          { key: 'instrumentVocalType', label: 'Instrument', type: 'select', options: ['Guitar', 'Piano', 'Violin', 'Tabla', 'Flute', 'Harmonium', 'Drums', 'Keyboard', 'Sitar', 'Sarod', 'Other'], required: true },
          { key: 'musicStyle', label: 'Music Style', type: 'select', options: ['Hindustani', 'Carnatic', 'Western', 'Jazz', 'Rock', 'Pop', 'Folk', 'Mixed'], required: true },
          { key: 'skillLevel', label: 'Skill Level', type: 'multiselect', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], required: true },
          { key: 'practiceRooms', label: 'Practice Rooms Available', type: 'toggle', required: true },
          { key: 'instrumentsProvided', label: 'Instruments Provided', type: 'toggle', required: true },
          { key: 'performanceOpportunities', label: 'Performance Opportunities', type: 'toggle', required: true },
          { key: 'recordingFacilities', label: 'Recording Facilities', type: 'toggle', required: true },
          { key: 'certification', label: 'Certification Available', type: 'toggle', required: true }
        ]
      }
    }
  },

  makeup: {
    label: 'Makeup & Beauty',
    subcategories: {
      professional: {
        label: 'Professional Makeup',
        fields: [
          { key: 'makeupSpecialization', label: 'Specialization', type: 'multiselect', options: ['Bridal', 'HD', 'Airbrush', 'Fashion', 'Editorial', 'Special Effects', 'Hairstyling'], required: true },
          { key: 'courseLevel', label: 'Course Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Master Class'], required: true },
          { key: 'practicalTraining', label: 'Practical Training', type: 'toggle', required: true },
          { key: 'kitIncluded', label: 'Kit Included', type: 'toggle', required: true },
          { key: 'kitCost', label: 'Kit Cost (if separate)', type: 'text' },
          { key: 'liveModelPractice', label: 'Live Model Practice', type: 'toggle', required: true },
          { key: 'portfolioCreation', label: 'Portfolio Creation', type: 'toggle', required: true },
          { key: 'freelancingSupport', label: 'Freelancing Support', type: 'toggle', required: true },
          { key: 'certification', label: 'Certification', type: 'toggle', required: true }
        ]
      },
      beauty: {
        label: 'Beauty & Cosmetology',
        fields: [
          { key: 'makeupSpecialization', label: 'Specialization', type: 'multiselect', options: ['Skincare', 'Hairstyling', 'Nail Art', 'Spa Therapy', 'Salon Management', 'Makeup'], required: true },
          { key: 'courseLevel', label: 'Course Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Diploma'], required: true },
          { key: 'practicalTraining', label: 'Practical Training', type: 'toggle', required: true },
          { key: 'kitIncluded', label: 'Kit Included', type: 'toggle', required: true },
          { key: 'kitCost', label: 'Kit Cost (if separate)', type: 'text' },
          { key: 'liveModelPractice', label: 'Live Model Practice', type: 'toggle', required: true },
          { key: 'portfolioCreation', label: 'Portfolio Creation', type: 'toggle', required: true },
          { key: 'freelancingSupport', label: 'Freelancing/Business Support', type: 'toggle', required: true },
          { key: 'certification', label: 'Certification', type: 'toggle', required: true }
        ]
      }
    }
  },

  stockmarket: {
    label: 'Stock Market & Trading',
    subcategories: {
      equity: {
        label: 'Equity Trading',
        fields: [
          { key: 'learningType', label: 'Learning Type', type: 'multiselect', options: ['Classroom', 'Online', 'Hybrid', 'One-on-One'], required: true },
          { key: 'equity', label: 'Equity Trading', type: 'toggle', required: true },
          { key: 'fo', label: 'F&O (Futures & Options)', type: 'toggle', required: true },
          { key: 'technicalAnalysis', label: 'Technical Analysis', type: 'toggle', required: true },
          { key: 'fundamentalAnalysis', label: 'Fundamental Analysis', type: 'toggle', required: true },
          { key: 'liveMarketSessions', label: 'Live Market Sessions', type: 'toggle', required: true },
          { key: 'paperTrading', label: 'Paper Trading/Simulation', type: 'toggle', required: true },
          { key: 'riskManagement', label: 'Risk Management Training', type: 'toggle', required: true },
          { key: 'practicalTraining', label: 'Practical Training', type: 'toggle', required: true },
          { key: 'certification', label: 'Certification', type: 'toggle', required: true }
        ]
      },
      derivatives: {
        label: 'Derivatives & Options',
        fields: [
          { key: 'learningType', label: 'Learning Type', type: 'multiselect', options: ['Classroom', 'Online', 'Hybrid', 'One-on-One'], required: true },
          { key: 'equity', label: 'Equity Trading', type: 'toggle', required: true },
          { key: 'fo', label: 'F&O (Futures & Options)', type: 'toggle', required: true },
          { key: 'technicalAnalysis', label: 'Technical Analysis', type: 'toggle', required: true },
          { key: 'fundamentalAnalysis', label: 'Fundamental Analysis', type: 'toggle', required: true },
          { key: 'liveMarketSessions', label: 'Live Market Sessions', type: 'toggle', required: true },
          { key: 'paperTrading', label: 'Paper Trading/Simulation', type: 'toggle', required: true },
          { key: 'riskManagement', label: 'Risk Management Training', type: 'toggle', required: true },
          { key: 'practicalTraining', label: 'Practical Training', type: 'toggle', required: true },
          { key: 'certification', label: 'Certification', type: 'toggle', required: true }
        ]
      }
    }
  },

  languages: {
    label: 'Languages',
    subcategories: {
      english: {
        label: 'English',
        fields: [
          { key: 'language', label: 'Language', type: 'text', required: true, defaultValue: 'English' },
          { key: 'level', label: 'Level Offered', type: 'multiselect', options: ['Beginner', 'Intermediate', 'Advanced', 'Business English', 'Academic English'], required: true },
          { key: 'cefrLevel', label: 'CEFR Level', type: 'multiselect', options: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
          { key: 'speaking', label: 'Speaking Practice', type: 'toggle', required: true },
          { key: 'listening', label: 'Listening Practice', type: 'toggle', required: true },
          { key: 'reading', label: 'Reading Practice', type: 'toggle', required: true },
          { key: 'writing', label: 'Writing Practice', type: 'toggle', required: true },
          { key: 'examPreparation', label: 'Exam Preparation (IELTS/TOEFL)', type: 'toggle', required: true },
          { key: 'practiceSessions', label: 'Practice Sessions', type: 'toggle', required: true }
        ]
      },
      foreignLanguage: {
        label: 'Foreign Languages',
        fields: [
          { key: 'language', label: 'Language', type: 'select', options: ['French', 'German', 'Spanish', 'Mandarin', 'Japanese', 'Korean', 'Italian', 'Russian', 'Arabic', 'Other'], required: true },
          { key: 'level', label: 'Level Offered', type: 'multiselect', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], required: true },
          { key: 'cefrLevel', label: 'CEFR Level', type: 'multiselect', options: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
          { key: 'speaking', label: 'Speaking Practice', type: 'toggle', required: true },
          { key: 'listening', label: 'Listening Practice', type: 'toggle', required: true },
          { key: 'reading', label: 'Reading Practice', type: 'toggle', required: true },
          { key: 'writing', label: 'Writing Practice', type: 'toggle', required: true },
          { key: 'examPreparation', label: 'Exam Preparation', type: 'toggle', required: true },
          { key: 'practiceSessions', label: 'Practice Sessions', type: 'toggle', required: true }
        ]
      }
    }
  },

  coding: {
    label: 'Coding & Technology',
    subcategories: {
      webdevelopment: {
        label: 'Web Development',
        fields: [
          { key: 'technology', label: 'Technology/Skill', type: 'multiselect', options: ['HTML/CSS', 'JavaScript', 'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'Full Stack'], required: true },
          { key: 'programmingLanguage', label: 'Programming Languages', type: 'multiselect', options: ['JavaScript', 'Python', 'PHP', 'Ruby', 'Java', 'TypeScript'], required: true },
          { key: 'projects', label: 'Projects Included', type: 'toggle', required: true },
          { key: 'practicalLabs', label: 'Practical Labs', type: 'toggle', required: true },
          { key: 'liveProjects', label: 'Live Projects', type: 'toggle', required: true },
          { key: 'gitTraining', label: 'Git/GitHub Training', type: 'toggle', required: true },
          { key: 'interviewPreparation', label: 'Interview Preparation', type: 'toggle', required: true },
          { key: 'placementAssistance', label: 'Placement Assistance', type: 'toggle', required: true }
        ]
      },
      dataScience: {
        label: 'Data Science & AI',
        fields: [
          { key: 'technology', label: 'Technology/Skill', type: 'multiselect', options: ['Python', 'R', 'Machine Learning', 'Deep Learning', 'Data Analysis', 'Big Data', 'AI/ML', 'NLP'], required: true },
          { key: 'programmingLanguage', label: 'Programming Languages', type: 'multiselect', options: ['Python', 'R', 'SQL', 'Scala', 'Julia'], required: true },
          { key: 'projects', label: 'Projects Included', type: 'toggle', required: true },
          { key: 'practicalLabs', label: 'Practical Labs', type: 'toggle', required: true },
          { key: 'liveProjects', label: 'Live Projects', type: 'toggle', required: true },
          { key: 'gitTraining', label: 'Git/GitHub Training', type: 'toggle', required: true },
          { key: 'interviewPreparation', label: 'Interview Preparation', type: 'toggle', required: true },
          { key: 'placementAssistance', label: 'Placement Assistance', type: 'toggle', required: true }
        ]
      },
      mobiledev: {
        label: 'Mobile Development',
        fields: [
          { key: 'technology', label: 'Technology/Skill', type: 'multiselect', options: ['Android', 'iOS', 'React Native', 'Flutter', 'Kotlin', 'Swift'], required: true },
          { key: 'programmingLanguage', label: 'Programming Languages', type: 'multiselect', options: ['Java', 'Kotlin', 'Swift', 'Dart', 'JavaScript'], required: true },
          { key: 'projects', label: 'Projects Included', type: 'toggle', required: true },
          { key: 'practicalLabs', label: 'Practical Labs', type: 'toggle', required: true },
          { key: 'liveProjects', label: 'Live Projects', type: 'toggle', required: true },
          { key: 'gitTraining', label: 'Git/GitHub Training', type: 'toggle', required: true },
          { key: 'interviewPreparation', label: 'Interview Preparation', type: 'toggle', required: true },
          { key: 'placementAssistance', label: 'Placement Assistance', type: 'toggle', required: true }
        ]
      }
    }
  }
};

/**
 * Get fields for a specific category and subcategory
 */
export const getCategoryFields = (primaryCategory, subcategory) => {
  if (!primaryCategory) return [];

  const category = categoryFieldsConfig[primaryCategory];
  if (!category) return [];

  if (!subcategory) return [];

  const subcat = category.subcategories[subcategory];
  if (!subcat) return [];

  return subcat.fields || [];
};

/**
 * Get all subcategories for a primary category
 */
export const getSubcategories = (primaryCategory) => {
  if (!primaryCategory) return [];

  const category = categoryFieldsConfig[primaryCategory];
  if (!category || !category.subcategories) return [];

  return Object.keys(category.subcategories).map(key => ({
    value: key,
    label: category.subcategories[key].label
  }));
};

/**
 * Validate category-specific data
 */
export const validateCategoryData = (primaryCategory, subcategory, data) => {
  const fields = getCategoryFields(primaryCategory, subcategory);
  const errors = [];

  fields.forEach(field => {
    if (field.required && !data[field.key]) {
      errors.push(`${field.label} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
