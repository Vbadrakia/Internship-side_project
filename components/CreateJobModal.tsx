import React, { useState } from 'react';
import { X, Plus, Trash2, MapPin, DollarSign, Building, Calendar, Clock, Sparkles } from 'lucide-react';
import { Job } from '../types';
import { generateJobDescription } from '../services/geminiService';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Omit<Job, 'id'>) => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [deadline, setDeadline] = useState('');
  const [postedAt, setPostedAt] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleAIGenerate = async () => {
    if (!title || !company) {
      alert("Please enter Job Title and Company first to generate details.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const data = await generateJobDescription(title, company, location || 'Remote');
      setDescription(data.description);
      setRequirements(data.requirements.length > 0 ? data.requirements : ['']);
      setResponsibilities(data.responsibilities.length > 0 ? data.responsibilities : ['']);
    } catch (error) {
      console.error("Error generating JD:", error);
      alert("Failed to generate job description. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Requirement Handlers
  const handleAddRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newReqs = [...requirements];
    newReqs[index] = value;
    setRequirements(newReqs);
  };

  const handleRemoveRequirement = (index: number) => {
    const newReqs = requirements.filter((_, i) => i !== index);
    setRequirements(newReqs);
  };

  // Responsibility Handlers
  const handleAddResponsibility = () => {
    setResponsibilities([...responsibilities, '']);
  };

  const handleResponsibilityChange = (index: number, value: string) => {
    const newResps = [...responsibilities];
    newResps[index] = value;
    setResponsibilities(newResps);
  };

  const handleRemoveResponsibility = (index: number) => {
    const newResps = responsibilities.filter((_, i) => i !== index);
    setResponsibilities(newResps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !description) return;

    const cleanRequirements = requirements.filter(r => r.trim() !== '');
    const cleanResponsibilities = responsibilities.filter(r => r.trim() !== '');

    onSubmit({
      title,
      company,
      location,
      salary,
      description,
      requirements: cleanRequirements,
      responsibilities: cleanResponsibilities,
      postedAt: postedAt,
      deadline: deadline || undefined
    });
    
    setTitle('');
    setCompany('');
    setLocation('');
    setSalary('');
    setDescription('');
    setDeadline('');
    setPostedAt(new Date().toISOString().split('T')[0]);
    setRequirements(['']);
    setResponsibilities(['']);
    onClose();
  };

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
           <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Post a New Job</h3>
              <button 
                type="button"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles size={12} />
                )}
                {isGenerating ? 'Generating...' : 'AI Generate JD'}
              </button>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
             <form id="create-job-form" onSubmit={handleSubmit} className="space-y-5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Job Title</label>
                         <input required type="text" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company</label>
                         <div className="relative">
                            <Building size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input required type="text" className="w-full pl-9 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. TechFlow" />
                         </div>
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</label>
                         <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input required type="text" className="w-full pl-9 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, NY" />
                         </div>
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Salary Range</label>
                         <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input required type="text" className="w-full pl-9 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. $140k - $180k" />
                         </div>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Posted Date</label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input type="date" className="w-full pl-9 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={postedAt} onChange={e => setPostedAt(e.target.value)} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Application Deadline (Optional)</label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input type="date" className="w-full pl-9 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={deadline} onChange={e => setDeadline(e.target.value)} />
                        </div>
                     </div>
                 </div>
                 
                 <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                     <textarea required className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role and overview..." />
                 </div>

                 {/* Responsibilities Section */}
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Job Responsibilities</label>
                    <div className="space-y-3">
                        {responsibilities.map((resp, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                                <textarea
                                    className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" 
                                    rows={2}
                                    value={resp} 
                                    onChange={e => handleResponsibilityChange(index, e.target.value)}
                                    placeholder="e.g. Lead the frontend team in migrating to Next.js..."
                                />
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveResponsibility(index)} 
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors mt-1"
                                    disabled={responsibilities.length === 1 && !resp}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddResponsibility} className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
                        <Plus size={16} /> Add Responsibility
                    </button>
                 </div>

                 {/* Requirements Section */}
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Requirements</label>
                    <div className="space-y-2">
                        {requirements.map((req, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></div>
                                <input 
                                    type="text" 
                                    className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                                    value={req} 
                                    onChange={e => handleRequirementChange(index, e.target.value)}
                                    placeholder="e.g. 5+ years of experience with React"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveRequirement(index)} 
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    disabled={requirements.length === 1 && !req}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddRequirement} className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
                        <Plus size={16} /> Add Requirement
                    </button>
                 </div>
             </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
             <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 font-medium hover:text-gray-900">Cancel</button>
             <button type="submit" form="create-job-form" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200">Post Job</button>
        </div>
      </div>
     </div>
  );
}