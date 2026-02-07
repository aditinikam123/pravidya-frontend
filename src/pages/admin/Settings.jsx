import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FORM_CONFIGS = {
  counselorFields: {
    title: '👥 Counselor Form',
    desc: 'Fields when adding/editing counselors. Username, Email, and Password are always required for new accounts.',
    labels: {
      username: 'Username',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      mobile: 'Mobile Number',
      expertise: 'Expertise / Specializations',
      languages: 'Languages',
      availability: 'Availability Status',
      maxCapacity: 'Max Capacity (leads)',
      schoolId: 'Assigned School',
    },
    requiredForNew: ['username', 'email', 'password'],
    // These fields always have "Required when shown" - admin cannot uncheck
    requiredWhenShownAlways: ['username', 'email', 'password', 'fullName', 'mobile', 'expertise', 'languages'],
  },
  institutionFields: {
    title: '🏫 Institution Form',
    desc: 'Fields when creating/editing institutions (schools & colleges).',
    requiredAlways: ['name', 'type'],
    labels: {
      name: 'Name',
      type: 'Type (School/College)',
      address: 'Address',
      pincode: 'Pincode',
      city: 'City',
      state: 'State',
      isActive: 'Active Status',
      logoUrl: 'Logo',
      boardsOffered: 'Select board(s)',
      standardsAvailable: 'Standards Available',
      streamsOffered: 'Streams Offered',
      admissionsOpen: 'Admissions Open',
      boardGradeMap: 'Board & Grade Map (schools)',
    },
    requiredForNew: [],
  },
  courseFields: {
    title: '🎓 College Course Form',
    desc: 'Fields when adding/editing college courses. Matches the Add/Edit Course form.',
    requiredAlways: ['name'],
    labels: {
      name: 'Course Name',
      code: 'Course Code',
      description: 'Description',
      duration: 'Duration',
      eligibility: 'Eligibility',
      isActive: 'Active',
    },
    requiredForNew: [],
  },
  schoolCourseFields: {
    title: '🏫 School Admission Form',
    desc: 'Fields when adding admission entries to schools. Everything is created at once (board, standard, stream, etc.).',
    requiredAlways: ['board', 'standardRange'],
    labels: {
      board: 'Board',
      standardRange: 'Standard Range',
      stream: 'Stream (for 11–12)',
      seats: 'Seats',
      admissionsOpen: 'Admissions Open',
    },
    requiredForNew: [],
  },
  schoolFields: {
    title: '🏛️ School Onboarding Form',
    desc: 'Fields when adding/editing schools in School Onboarding. Matches the form UI.',
    requiredAlways: ['name'],
    labels: {
      name: 'Institution Name',
      type: 'Type (School/College)',
      logo: 'Logo',
      boards: 'Select board(s)',
      address: 'Address',
      city: 'City',
      state: 'State',
      active: 'Active',
    },
    requiredForNew: [],
  },
  admissionFormFields: {
    title: '📝 Admission Enquiry Form (Public)',
    desc: 'Fields shown on the public admission enquiry form. Institution and Course are required for submission.',
    labels: {
      parentName: 'Parent Name',
      parentMobile: 'Mobile Number',
      parentEmail: 'Email',
      parentCity: 'City',
      preferredLanguage: 'Preferred Language',
      studentName: 'Student Name',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      currentClass: 'Current Class',
      boardUniversity: 'Board / University',
      marksPercentage: 'Marks / Percentage',
      institution: 'Institution',
      course: 'Course',
      academicYear: 'Academic Year',
      preferredCounselingMode: 'Counseling Mode',
      notes: 'Notes',
    },
    requiredForNew: ['institution', 'course'],
    requiredAlways: ['institution', 'course', 'parentName', 'parentMobile', 'parentEmail', 'parentCity', 'preferredLanguage', 'studentName', 'dateOfBirth', 'gender', 'currentClass', 'academicYear', 'preferredCounselingMode'],
  },
};

const getDefaultRequiredFields = (config) => {
  const always = config.requiredAlways || [];
  const forNew = config.requiredForNew || [];
  const whenShownAlways = config.requiredWhenShownAlways || [];
  const keys = [...new Set([...always, ...forNew, ...whenShownAlways])];
  return Object.fromEntries(keys.map((k) => [k, true]));
};

const defaultState = () => ({
  counselorFields: { username: true, email: true, password: true, fullName: true, mobile: true, expertise: true, languages: true, availability: true, maxCapacity: true, schoolId: true, customFields: [], requiredFields: getDefaultRequiredFields(FORM_CONFIGS.counselorFields) },
  institutionFields: { name: true, type: true, address: true, pincode: true, city: true, state: true, isActive: true, logoUrl: true, boardsOffered: true, standardsAvailable: true, streamsOffered: true, admissionsOpen: true, boardGradeMap: true, customFields: [], requiredFields: getDefaultRequiredFields(FORM_CONFIGS.institutionFields) },
  courseFields: { name: true, code: true, description: true, duration: true, eligibility: true, isActive: true, customFields: [], requiredFields: getDefaultRequiredFields(FORM_CONFIGS.courseFields) },
  schoolCourseFields: { board: true, standardRange: true, stream: true, seats: true, admissionsOpen: true, customFields: [], requiredFields: getDefaultRequiredFields(FORM_CONFIGS.schoolCourseFields) },
  schoolFields: { name: true, type: true, logo: true, boards: true, address: true, city: true, state: true, active: true, customFields: [], requiredFields: getDefaultRequiredFields(FORM_CONFIGS.schoolFields) },
  admissionFormFields: { parentName: true, parentMobile: true, parentEmail: true, parentCity: true, preferredLanguage: true, studentName: true, dateOfBirth: true, gender: true, currentClass: true, boardUniversity: true, marksPercentage: true, institution: true, course: true, academicYear: true, preferredCounselingMode: true, notes: true, customFields: [], requiredFields: getDefaultRequiredFields(FORM_CONFIGS.admissionFormFields) },
});

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFormKey, setSavingFormKey] = useState(null);
  const [expanded, setExpanded] = useState({ counselorFields: true, courseFields: true, schoolCourseFields: true });
  const [activeTab, setActiveTab] = useState('customizeForm');
  const [trinityExpanded, setTrinityExpanded] = useState(true);
  const [formFields, setFormFields] = useState(defaultState());
  // Add field modal (like reference design)
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [addFieldFormKey, setAddFieldFormKey] = useState(null);
  const [addFieldForm, setAddFieldForm] = useState({
    title: '',
    placeholder: '',
    type: 'text',
    options: [],
    optionsInput: '',
    required: false,
  });

  const openAddFieldModal = (formKey) => {
    setAddFieldFormKey(formKey);
    setAddFieldForm({ title: '', placeholder: '', type: 'text', options: [], optionsInput: '', required: false });
    setShowAddFieldModal(true);
  };

  const closeAddFieldModal = () => {
    setShowAddFieldModal(false);
    setAddFieldFormKey(null);
  };

  const addOptionToField = (opt) => {
    const trimmed = (opt || addFieldForm.optionsInput || '').trim();
    if (!trimmed || addFieldForm.options.includes(trimmed)) return;
    setAddFieldForm((prev) => ({
      ...prev,
      options: [...prev.options, trimmed],
      optionsInput: '',
    }));
  };

  const removeOptionFromField = (opt) => {
    setAddFieldForm((prev) => ({ ...prev, options: prev.options.filter((o) => o !== opt) }));
  };

  const handleAddFieldFromModal = () => {
    if (!addFieldFormKey) return;
    const title = addFieldForm.title.trim();
    if (!title) {
      toast.error('Please enter a field title');
      return;
    }
    const key = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!key) {
      toast.error('Please enter a valid field name');
      return;
    }
    const customFields = formFields[addFieldFormKey]?.customFields || [];
    if (customFields.some((f) => f.key === key)) {
      toast.error('This field already exists');
      return;
    }
    const type = addFieldForm.type;
    const options = (type === 'dropdown' || type === 'checkbox') ? addFieldForm.options : undefined;
    if ((type === 'dropdown' || type === 'checkbox') && (!options || options.length === 0)) {
      toast.error('Please add at least one option');
      return;
    }
    const newField = {
      key,
      label: title,
      placeholder: addFieldForm.placeholder.trim() || undefined,
      required: addFieldForm.required,
      type,
      ...(options?.length ? { options } : {}),
    };
    setFormFields((prev) => ({
      ...prev,
      [addFieldFormKey]: {
        ...prev[addFieldFormKey],
        customFields: [...(prev[addFieldFormKey]?.customFields || []), newField],
      },
    }));
    closeAddFieldModal();
    toast('Click "Save All Settings" to apply changes to forms', { icon: '💾', duration: 4000 });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSettings();
      const data = res.data?.data || {};
      const next = defaultState();
      Object.keys(next).forEach((key) => {
        if (data[key] && typeof data[key] === 'object') {
          next[key] = { ...next[key], ...data[key] };
          // Enforce requiredWhenShownAlways fields stay true for counselor
          const config = FORM_CONFIGS[key];
          const whenShownAlways = config?.requiredWhenShownAlways || [];
          if (whenShownAlways.length > 0 && next[key].requiredFields) {
            const rf = { ...next[key].requiredFields };
            whenShownAlways.forEach((fk) => { rf[fk] = true; });
            next[key].requiredFields = rf;
          }
        }
      });
      setFormFields(next);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (formKey, fieldKey) => {
    setFormFields((prev) => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        [fieldKey]: !(prev[formKey][fieldKey] !== false),
      },
    }));
  };

  const handleRequiredToggle = (formKey, fieldKey, value) => {
    setFormFields((prev) => {
      const rf = prev[formKey]?.requiredFields || {};
      return {
        ...prev,
        [formKey]: {
          ...prev[formKey],
          requiredFields: { ...rf, [fieldKey]: !!value },
        },
      };
    });
  };

  const isFieldRequired = (formKey, fieldKey, config) => {
    const always = config.requiredAlways || [];
    if (always.includes(fieldKey)) return true;
    const rf = formFields[formKey]?.requiredFields || {};
    return rf[fieldKey] === true;
  };

  const toggleCustomFieldRequired = (formKey, customKey) => {
    setFormFields((prev) => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        customFields: (prev[formKey]?.customFields || []).map((f) =>
          f.key === customKey ? { ...f, required: !(f.required === true) } : f
        ),
      },
    }));
  };

  const removeCustomField = (formKey, key) => {
    setFormFields((prev) => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        customFields: (prev[formKey]?.customFields || []).filter((f) => f.key !== key),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = { ...formFields };
      // Enforce requiredWhenShownAlways for counselor before save
      const whenShownAlways = FORM_CONFIGS.counselorFields?.requiredWhenShownAlways || [];
      if (whenShownAlways.length > 0 && toSave.counselorFields?.requiredFields) {
        const rf = { ...toSave.counselorFields.requiredFields };
        whenShownAlways.forEach((fk) => { rf[fk] = true; });
        toSave.counselorFields = { ...toSave.counselorFields, requiredFields: rf };
      }
      // Keep courseFields aligned with form: only name, code, description, duration, eligibility, isActive
      if (toSave.courseFields) {
        const { institution, stream, seats, admissionsOpen, ...rest } = toSave.courseFields;
        const rf = rest.requiredFields || {};
        delete rf.institution;
        delete rf.stream;
        delete rf.seats;
        delete rf.admissionsOpen;
        toSave.courseFields = { ...rest, requiredFields: rf };
      }
      // Keep schoolFields aligned with form: only name, type, logo, boards, address, city, state, active
      if (toSave.schoolFields) {
        const { academicYear, contactEmail, contactPhone, capacity, pockets, board, ...rest } = toSave.schoolFields;
        const rf = rest.requiredFields || {};
        delete rf.academicYear;
        delete rf.contactEmail;
        delete rf.contactPhone;
        delete rf.capacity;
        delete rf.pockets;
        delete rf.board;
        toSave.schoolFields = { ...rest, requiredFields: rf };
      }
      await adminAPI.updateSettings(toSave);
      setFormFields(toSave);
      window.dispatchEvent(new CustomEvent('settings-updated'));
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const prepareSectionForSave = (formKey, data) => {
    if (formKey === 'counselorFields') {
      const whenShownAlways = FORM_CONFIGS.counselorFields?.requiredWhenShownAlways || [];
      if (whenShownAlways.length > 0 && data.requiredFields) {
        const rf = { ...data.requiredFields };
        whenShownAlways.forEach((fk) => { rf[fk] = true; });
        return { ...data, requiredFields: rf };
      }
    }
    if (formKey === 'courseFields') {
      const { institution, stream, seats, admissionsOpen, ...rest } = data;
      const rf = rest.requiredFields || {};
      delete rf.institution;
      delete rf.stream;
      delete rf.seats;
      delete rf.admissionsOpen;
      return { ...rest, requiredFields: rf };
    }
    if (formKey === 'schoolFields') {
      const { academicYear, contactEmail, contactPhone, capacity, pockets, board, ...rest } = data;
      const rf = rest.requiredFields || {};
      delete rf.academicYear;
      delete rf.contactEmail;
      delete rf.contactPhone;
      delete rf.capacity;
      delete rf.pockets;
      delete rf.board;
      return { ...rest, requiredFields: rf };
    }
    return data;
  };

  const handleSaveSection = async (formKey) => {
    const data = formFields[formKey];
    if (!data) return;
    setSavingFormKey(formKey);
    try {
      const prepared = prepareSectionForSave(formKey, data);
      await adminAPI.updateSettings({ [formKey]: prepared });
      setFormFields((prev) => ({ ...prev, [formKey]: prepared }));
      window.dispatchEvent(new CustomEvent('settings-updated'));
      toast.success(`${FORM_CONFIGS[formKey]?.title || formKey} saved`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSavingFormKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage platform configuration and form customization</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Settings tabs">
          <button
            type="button"
            onClick={() => setActiveTab('customizeForm')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'customizeForm'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customize Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'help'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Help
          </button>
        </nav>
      </div>

      {activeTab === 'help' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">How Settings Work</h2>
              <p className="text-gray-600">
                The Settings page lets you customize which fields appear on each form and whether they are required. Your changes apply across the platform as soon as you save.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Form sections</h3>
              <p className="text-gray-600 mb-3">Each form has its own configuration section:</p>
              <ul className="space-y-2 text-gray-600 list-disc list-inside">
                <li><strong>Institution Form</strong> — Controls the Add New Institution and Edit Institution forms (Admin → Institutions). Used when creating or editing schools and colleges.</li>
                <li><strong>College Course Form</strong> — Controls the Add/Edit Course form when adding college courses to an institution.</li>
                <li><strong>Admission Enquiry Form (Public)</strong> — Controls the public admission enquiry form that visitors use to submit enquiries.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Visibility (main checkbox)</h3>
              <p className="text-gray-600 mb-2">
                Each field has a main checkbox that controls whether the field is <strong>shown</strong> on the form:
              </p>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                <li><strong>Checked</strong> — The field appears on the form.</li>
                <li><strong>Unchecked</strong> — The field is hidden and will not appear on the form.</li>
              </ul>
              <p className="text-gray-500 text-sm mt-2">Fields marked &quot;(always on)&quot; cannot be hidden and will always appear.</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Required when shown</h3>
              <p className="text-gray-600 mb-2">
                When a field is visible, you can mark it as required:
              </p>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                <li><strong>Checked</strong> — Users must fill this field before submitting the form. A red asterisk (*) appears next to the field label.</li>
                <li><strong>Unchecked</strong> — The field is optional and can be left blank.</li>
              </ul>
              <p className="text-gray-500 text-sm mt-2">This option only appears when the field is visible. Required when shown applies only when the field is shown.</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Saving changes</h3>
              <p className="text-gray-600 mb-2">
                After changing any setting:
              </p>
              <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                <li>Click <strong>Save All Settings</strong> at the bottom of the page.</li>
                <li>Wait for the success message.</li>
                <li>Forms will automatically pick up the new settings when you open or refresh them.</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Where settings apply</h3>
              <table className="min-w-full text-sm text-gray-600 border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-800">Setting</th>
                    <th className="text-left p-3 font-medium text-gray-800">Applies to</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200"><td className="p-3">Institution Form</td><td className="p-3">Add New Institution, Edit Institution (schools &amp; colleges)</td></tr>
                  <tr className="border-t border-gray-200"><td className="p-3">College Course Form</td><td className="p-3">Add/Edit Course (inside Edit Institution when type is College)</td></tr>
                  <tr className="border-t border-gray-200"><td className="p-3">Admission Enquiry Form</td><td className="p-3">Public admission enquiry form (visitor-facing)</td></tr>
                </tbody>
              </table>
            </div>

            <div className="bg-primary-50/50 rounded-lg p-4 border border-primary-100">
              <p className="text-sm text-primary-800 font-medium">Need help?</p>
              <p className="text-sm text-primary-700 mt-1">Settings are stored and shared across all users. Changes take effect immediately after saving. If a form does not reflect your changes, refresh the page or navigate away and back.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customizeForm' && (
        <div className="space-y-6">
      {/* Trinity Form Integration - shown in Settings for reference */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setTrinityExpanded((p) => !p)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900">🔗 Trinity College Form → Pravidya Lead Integration</h2>
          <span className="text-gray-400 text-xl">{trinityExpanded ? '−' : '+'}</span>
        </button>
        {trinityExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-3">
              When users submit the enquiry form on the Trinity College website, a new lead is created in Pravidya and appears in <strong>Admin → Leads</strong>.
            </p>
            <div className="text-sm space-y-2 mb-4">
              <p><strong>Setup:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Add Trinity institutions in Pravidya Admin → Institutions</li>
                <li>Set <code className="bg-gray-100 px-1 rounded">VITE_PRAVIDYA_API_URL</code> in the Trinity site .env</li>
                <li>Trinity form POSTs to <code className="bg-gray-100 px-1 rounded">POST /api/leads/simple</code></li>
              </ul>
              <p className="text-gray-600">
                Required fields: <code className="bg-gray-100 px-1 rounded">student_name</code>, <code className="bg-gray-100 px-1 rounded">parent_name</code>, <code className="bg-gray-100 px-1 rounded">student_phone</code>, <code className="bg-gray-100 px-1 rounded">college</code>, <code className="bg-gray-100 px-1 rounded">city_state</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {Object.entries(FORM_CONFIGS).map(([formKey, config]) => (
        <div key={formKey} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection(formKey)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
            <span className="text-gray-400 text-xl">{expanded[formKey] ? '−' : '+'}</span>
          </button>
          {expanded[formKey] && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-4">{config.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(config.labels).map(([fieldKey, label]) => {
                  const alwaysRequired = config.requiredAlways?.includes(fieldKey);
                  const requiredWhenShownAlways = config.requiredWhenShownAlways?.includes(fieldKey);
                  const required = alwaysRequired || requiredWhenShownAlways || isFieldRequired(formKey, fieldKey, config);
                  return (
                    <div
                      key={fieldKey}
                      className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formFields[formKey]?.[fieldKey] !== false}
                          onChange={() => handleToggle(formKey, fieldKey)}
                          disabled={alwaysRequired}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-800">{label}</span>
                        {alwaysRequired && (
                          <span className="text-xs text-gray-500">(always on)</span>
                        )}
                      </label>
                      {!alwaysRequired && formFields[formKey]?.[fieldKey] !== false && (
                        <label className={`flex items-center gap-2 ml-6 ${requiredWhenShownAlways ? 'cursor-default' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={required}
                            onChange={(e) => !requiredWhenShownAlways && handleRequiredToggle(formKey, fieldKey, e.target.checked)}
                            disabled={requiredWhenShownAlways}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">
                            Required when shown
                            {requiredWhenShownAlways && <span className="text-gray-500 ml-1">(always)</span>}
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Custom fields</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(formFields[formKey]?.customFields || []).map(({ key, label, required, type: fieldType, options: fieldOptions }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-800 text-sm"
                    >
                      {label}
                      <span className="text-xs text-gray-500">({({
                        dropdown: 'select', checkbox: 'multi-select', url: 'link',
                        text: 'text', textarea: 'textarea', email: 'email',
                        number: 'number', date: 'date', time: 'time'
                      })[fieldType] || fieldType || 'text'})</span>
                      <label className="flex items-center gap-1 cursor-pointer" title="Required when shown">
                        <input
                          type="checkbox"
                          checked={required === true}
                          onChange={() => toggleCustomFieldRequired(formKey, key)}
                          className="rounded text-xs"
                        />
                        <span className="text-xs text-gray-600">Req</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeCustomField(formKey, key)}
                        className="text-primary-600 hover:text-primary-800 text-lg leading-none"
                        aria-label={`Remove ${label}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => openAddFieldModal(formKey)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                  Add field
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSection(formKey)}
                  disabled={savingFormKey === formKey}
                  className="btn-primary text-sm py-2 px-4"
                >
                  {savingFormKey === formKey ? 'Saving...' : 'Save'}
                </button>
              </div>
              {formKey === 'courseFields' && (
                <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-1">🔗 Trinity Form Integration</p>
                  <p className="text-xs text-blue-700">
                    Trinity College form submissions create leads in Pravidya (POST /api/leads/simple). Add Trinity institutions in Admin → Institutions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-800 mb-1">💡 How it works</p>
        <p>
          <strong>Visibility:</strong> Toggle fields on or off for each form. Disabled fields will not be shown to users.
        </p>
        <p className="mt-2">
          <strong>Required vs Optional:</strong> For each visible field (except &quot;always on&quot; ones), you can mark it as Required or Optional. Required fields must be filled before submission; optional fields can be left blank.
        </p>
      </div>
        </div>
      )}

      {/* Add field modal */}
      {showAddFieldModal && addFieldFormKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add field</h2>
              <button
                type="button"
                onClick={closeAddFieldModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={addFieldForm.title}
                  onChange={(e) => setAddFieldForm((p) => ({ ...p, title: e.target.value }))}
                  className="input-field w-full"
                  placeholder="e.g. Favorite color"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                <input
                  type="text"
                  value={addFieldForm.placeholder}
                  onChange={(e) => setAddFieldForm((p) => ({ ...p, placeholder: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Placeholder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                <select
                  value={addFieldForm.type}
                  onChange={(e) => setAddFieldForm((p) => ({ ...p, type: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="dropdown">Select</option>
                  <option value="checkbox">Multi Select</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="url">External Link (URL)</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                </select>
              </div>
              {(addFieldForm.type === 'dropdown' || addFieldForm.type === 'checkbox') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                    {addFieldForm.options.map((opt) => (
                      <span
                        key={opt}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => removeOptionFromField(opt)}
                          className="text-gray-500 hover:text-red-600 leading-none"
                          aria-label={`Remove ${opt}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={addFieldForm.optionsInput}
                      onChange={(e) => setAddFieldForm((p) => ({ ...p, optionsInput: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addOptionToField();
                        }
                      }}
                      onBlur={() => addFieldForm.optionsInput.trim() && addOptionToField()}
                      placeholder={addFieldForm.options.length ? 'Add option...' : 'Type and press Enter'}
                      className="flex-1 min-w-[120px] outline-none border-0 bg-transparent text-sm"
                    />
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFieldForm.required}
                  onChange={(e) => setAddFieldForm((p) => ({ ...p, required: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeAddFieldModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <span>×</span>
                Close
              </button>
              <button
                type="button"
                onClick={handleAddFieldFromModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                <span>✓</span>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
