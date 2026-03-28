import React, { useState, useMemo } from 'react';
import { Application, ApplicationStatus, Job, User, SourcingAgent, ExternalCandidate, RecruiterSubscription } from '../types';
import { Check, X, Clock, MessageSquare, Briefcase, Eye, Plus, FileText, Calendar, Video, TrendingUp, Cpu, Sparkles, Target, Zap, ShieldCheck, Mail, Filter, ArrowUpDown, ChevronDown, Search, MapPin, Building2 } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { CandidateProfile } from './CandidateProfile';
import { CreateJobModal } from './CreateJobModal';
import { ReputationBadge } from './ReputationBadge';
import { calculateReputation } from '../utils/reputationUtils';
import { AISourcingDashboard } from './AISourcingDashboard';
import { SubscriptionManager } from './SubscriptionManager';

interface RecruiterDashboardProps {
  jobs: Job[];
  applications: Application[];
  onUpdateStatus: (appId: string, status: ApplicationStatus, feedback?: string) => void;
  onAddJob: (job: Omit<Job, 'id'>) => void;
  onSubscribe: (tier: string) => void;
  onToggleBlindHiring: () => void;
  onShareWithHM: (appId: string) => void;
  onScoreCandidate: (appId: string) => void;
  currentUser: User;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ 
  jobs, 
  applications, 
  onUpdateStatus, 
  onAddJob, 
  onSubscribe, 
  onToggleBlindHiring,
  onShareWithHM,
  onScoreCandidate,
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'talent' | 'ai-sourcing' | 'billing'>('talent');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id || null);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; appId: string; candidateName: string } | null>(null);
  const [viewCandidate, setViewCandidate] = useState<{ id: string; name: string; email: string; skills: string[] } | null>(null);
  const [outreachModal, setOutreachModal] = useState<{ isOpen: boolean; candidateName: string; message: string; loading: boolean } | null>(null);
  const [isJobModalOpen, setJobModalOpen] = useState(false);
  const [isScoring, setIsScoring] = useState<string | null>(null);
  
  const isBlindHiring = currentUser.settings?.blindHiring;
  
  // Sourcing Agents State (Normally in parent or server)
  const [agents, setAgents] = useState<SourcingAgent[]>([]);

  // Filter and Sort State
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCompany, setFilterCompany] = useState<string>('All');
  const [filterLocation, setFilterLocation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Date Posted');

  const myJobs = useMemo(() => {
    // For this demo, let's show all jobs if the recruiter's company is not set, 
    // or filter by their company if it is.
    let filtered = jobs.filter(j => !currentUser.company || j.company === currentUser.company);

    // Filter by Status
    if (filterStatus !== 'All') {
      filtered = filtered.filter(j => j.status === filterStatus);
    }

    // Filter by Company
    if (filterCompany !== 'All') {
      filtered = filtered.filter(j => j.company === filterCompany);
    }

    // Filter by Location
    if (filterLocation !== 'All') {
      filtered = filtered.filter(j => j.location === filterLocation);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'Job Title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'Number of Applications') {
        const countA = applications.filter(app => app.jobId === a.id).length;
        const countB = applications.filter(app => app.jobId === b.id).length;
        return countB - countA;
      }
      // Default: Date Posted (postedAt)
      return b.postedAt.localeCompare(a.postedAt);
    });
  }, [jobs, currentUser.company, filterStatus, filterCompany, filterLocation, sortBy, applications]);

  const companies = useMemo(() => ['All', ...Array.from(new Set(jobs.filter(j => !currentUser.company || j.company === currentUser.company).map(j => j.company)))], [jobs, currentUser.company]);
  const locations = useMemo(() => ['All', ...Array.from(new Set(jobs.filter(j => !currentUser.company || j.company === currentUser.company).map(j => j.location)))], [jobs, currentUser.company]);

  const selectedJob = myJobs.find(j => j.id === selectedJobId) || myJobs[0];
  const jobApplications = applications.filter(a => a.jobId === (selectedJob?.id || ''));

  const reputationStats = useMemo(() => calculateReputation(applications), [applications]);

  const handleRejectClick = (app: Application) => {
    setFeedbackModal({
      isOpen: true,
      appId: app.id,
      candidateName: app.candidateName
    });
  };

  const handleDraftOutreach = async (app: Application) => {
    setOutreachModal({
      isOpen: true,
      candidateName: app.candidateName,
      message: '',
      loading: true
    });

    try {
      const { draftOutreachMessage } = await import('../services/geminiService');
      const message = await draftOutreachMessage(app.candidateName, selectedJob?.title || 'this role', app.aiReason || app.skills.join(', '));
      setOutreachModal(prev => prev ? { ...prev, message, loading: false } : null);
    } catch (error) {
      console.error("Error drafting outreach:", error);
      setOutreachModal(prev => prev ? { ...prev, loading: false, message: 'Failed to draft message. Please try again.' } : null);
    }
  };

  const handleAIScore = async (app: Application) => {
    setIsScoring(app.id);
    try {
      await onScoreCandidate(app.id);
    } finally {
      setIsScoring(null);
    }
  };

  const handleSubmitFeedback = (feedback: string) => {
    if (feedbackModal) {
      onUpdateStatus(feedbackModal.appId, ApplicationStatus.REJECTED, feedback);
      setFeedbackModal(null);
    }
  };

  const handleCreateJob = (jobData: Omit<Job, 'id'>) => {
      onAddJob(jobData);
  };

  const handleAddAgent = (agentData: Omit<SourcingAgent, 'id'>) => {
    const newAgent: SourcingAgent = {
      ...agentData,
      id: `agent_${Date.now()}`
    };
    setAgents([...agents, newAgent]);
  };

  const handleToggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
  };

  const handleFoundMatch = (jobId: string, candidate: ExternalCandidate, score: number, reason: string) => {
    // Add to applications as an "AI Sourced" entry
    const newApp: Application = {
      id: `ai_${Date.now()}`,
      jobId,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      appliedAt: new Date().toISOString(),
      status: ApplicationStatus.APPLIED,
      skills: candidate.skills,
      aiScore: score,
      aiReason: reason
    };
    // Use local update to avoid parent propagation complexity in this turn
    // (In real app, this would hit API and update global state)
    // For now we just alert
    alert(`AI Found High-Fit Match for ${jobs.find(j => j.id === jobId)?.title}: ${candidate.name} (${score}%)`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Top Navigation */}
      <div className="bg-white px-4 border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-start md:items-center justify-between py-4">
           <div className="flex items-center gap-4">
              <img src={currentUser.avatar} className="w-10 h-10 rounded-xl shadow-sm border border-gray-200" alt="Avatar" />
              <div>
                 <h1 className="text-sm font-black text-gray-900 leading-none">Recruiter HQ</h1>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{currentUser.company}</p>
              </div>
           </div>
           
           <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('talent')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'talent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Talent Hub
              </button>
              <button 
                onClick={() => setActiveTab('ai-sourcing')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'ai-sourcing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Cpu size={14} /> AI Sourcing
              </button>
              <button 
                onClick={() => setActiveTab('billing')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'billing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <ShieldCheck size={14} /> SaaS Plan
              </button>
           </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'billing' ? (
            <SubscriptionManager 
              currentUser={currentUser} 
              onSubscribe={onSubscribe} 
            />
          ) : activeTab === 'ai-sourcing' ? (
            <AISourcingDashboard 
              currentUser={currentUser}
              jobs={jobs}
              agents={agents}
              onAddAgent={handleAddAgent}
              onToggleAgent={handleToggleAgent}
              onFoundMatch={handleFoundMatch}
            />
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* Quick Stats & AI Banner */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5">
                    <ReputationBadge stats={reputationStats} />
                  </div>
                  <div className="lg:col-span-7 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                           <Cpu size={24} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Hire Smarter with AI Agents</h3>
                      </div>
                      <p className="text-blue-100 text-sm max-w-md mb-6 leading-relaxed font-medium">
                        Deploy autonomous sourcing agents to scan millions of profiles and find high-fit candidates while you sleep.
                      </p>
                      <button 
                        onClick={() => setActiveTab('ai-sourcing')}
                        className="bg-white text-blue-700 px-8 py-3 rounded-2xl text-sm font-black shadow-xl hover:bg-blue-50 transition-all flex items-center gap-3 w-fit group"
                      >
                        <Zap size={18} className="group-hover:scale-110 transition-transform" /> 
                        Deploy New Agent
                      </button>
                    </div>
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                       <Cpu size={240} />
                    </div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  </div>
               </div>

               {/* Job Filtering & Sorting */}
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <Filter size={20} className="text-blue-600" />
                      My Jobs
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                      <TrendingUp size={14} className="text-green-500" />
                      {myJobs.length} Active Roles
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-black text-gray-400 ml-1">Status</label>
                      <div className="relative">
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 appearance-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Company Filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-black text-gray-400 ml-1">Company</label>
                      <div className="relative">
                        <select 
                          value={filterCompany}
                          onChange={(e) => setFilterCompany(e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 appearance-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          {companies.map(c => <option key={c} value={c}>{c === 'All' ? 'All Companies' : c}</option>)}
                        </select>
                        <Building2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-black text-gray-400 ml-1">Location</label>
                      <div className="relative">
                        <select 
                          value={filterLocation}
                          onChange={(e) => setFilterLocation(e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 appearance-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          {locations.map(l => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
                        </select>
                        <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sorting */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-black text-gray-400 ml-1">Sort By</label>
                      <div className="relative">
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full bg-blue-50 border-none rounded-xl px-4 py-2.5 text-xs font-black text-blue-700 appearance-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="Date Posted">Date Posted</option>
                          <option value="Job Title">Job Title</option>
                          <option value="Number of Applications">Number of Applications</option>
                        </select>
                        <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
               </div>

               {/* Job Navigation & Post Button */}
               <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 mr-4">
                    {myJobs.length === 0 ? (
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 italic">No jobs match your filters</div>
                    ) : (
                      myJobs.map(job => (
                        <button
                          key={job.id}
                          onClick={() => setSelectedJobId(job.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                              selectedJobId === job.id
                              ? 'bg-gray-900 text-white shadow-md'
                              : 'bg-transparent text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {job.title}
                          <span className={`w-2 h-2 rounded-full ${job.status === 'Open' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </button>
                      ))
                    )}
                  </div>
                  <button 
                    onClick={() => setJobModalOpen(true)}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                  >
                    <Plus size={16} /> Post Job
                  </button>
               </div>

               {/* Candidate List */}
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {jobApplications.length === 0 ? (
                      <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase size={24} className="text-gray-300" />
                          </div>
                          <p className="text-gray-400 font-bold">No applications for this role yet.</p>
                      </div>
                  ) : (
                    jobApplications
                      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
                      .map(app => (
                      <div key={app.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative">
                          {/* AI Score Badge */}
                          {app.aiScore && (
                            <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg ${
                              app.aiScore >= 80 ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-white'
                            }`}>
                              <Cpu size={12} /> AI Match: {app.aiScore}%
                            </div>
                          )}

                          <div className="flex justify-between items-start mb-4 mt-2">
                            <div 
                                className="cursor-pointer"
                                onClick={() => setViewCandidate({
                                  id: app.candidateId,
                                  name: app.candidateName,
                                  email: app.candidateEmail,
                                  skills: app.skills
                                })}
                            >
                                <h3 className="font-black text-gray-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                    {isBlindHiring ? `Candidate #${app.candidateId.slice(-4)}` : app.candidateName}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{isBlindHiring ? 'Identity Hidden' : app.candidateEmail}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                    app.status === ApplicationStatus.APPLIED ? 'bg-blue-50 text-blue-600' :
                                    app.status === ApplicationStatus.REVIEWING ? 'bg-amber-50 text-amber-600' :
                                    app.status === ApplicationStatus.INTERVIEWING ? 'bg-purple-50 text-purple-600' :
                                    app.status === ApplicationStatus.SCHEDULED ? 'bg-green-600 text-white' :
                                    app.status === ApplicationStatus.REJECTED ? 'bg-red-50 text-red-600' :
                                    'bg-green-50 text-green-600'
                                }`}>
                                    {app.status}
                                </span>
                                {app.isSharedWithHM && (
                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">Shared with HM</span>
                                )}
                            </div>
                          </div>

                          {/* Explainable AI Rationale */}
                          {app.aiReason && (
                             <div className="mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 flex gap-3">
                                <Sparkles size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                                   {app.aiReason}
                                </p>
                             </div>
                          )}

                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {app.skills.map(skill => (
                                <span key={skill} className="text-[10px] bg-white text-gray-500 px-2.5 py-1 rounded-lg border border-gray-100 font-bold">
                                {skill}
                                </span>
                            ))}
                          </div>

                          {app.status !== ApplicationStatus.REJECTED && app.status !== ApplicationStatus.OFFER && app.status !== ApplicationStatus.SCHEDULED && (
                            <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectClick(app)}
                                  className="flex-1 py-2.5 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    const nextStatus = 
                                      app.status === ApplicationStatus.APPLIED ? ApplicationStatus.REVIEWING : 
                                      app.status === ApplicationStatus.REVIEWING ? ApplicationStatus.INTERVIEWING :
                                      ApplicationStatus.OFFER;
                                    onUpdateStatus(app.id, nextStatus);
                                  }}
                                  className="flex-1 py-2.5 text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Zap size={14} /> Next Step
                                </button>
                                {!app.aiScore && (
                                    <button
                                        onClick={() => handleAIScore(app)}
                                        disabled={isScoring === app.id}
                                        className={`p-2.5 rounded-xl transition-colors ${isScoring === app.id ? 'bg-indigo-50 text-indigo-400' : 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                        title="Score with AI"
                                    >
                                        <Cpu size={18} className={isScoring === app.id ? 'animate-spin' : ''} />
                                    </button>
                                )}
                                {!app.isSharedWithHM && (
                                    <button
                                        onClick={() => onShareWithHM(app.id)}
                                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                        title="Share with Hiring Manager"
                                    >
                                        <ShieldCheck size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDraftOutreach(app)}
                                    className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                    title="Draft AI Outreach"
                                >
                                    <Mail size={18} />
                                </button>
                            </div>
                          )}
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>
      </main>

      {feedbackModal && selectedJob && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal(null)}
          candidateName={feedbackModal.candidateName}
          jobTitle={selectedJob.title}
          onSubmit={handleSubmitFeedback}
        />
      )}

      {viewCandidate && (
          <CandidateProfile 
            isOpen={!!viewCandidate}
            onClose={() => setViewCandidate(null)}
            candidate={viewCandidate}
            history={applications
              .filter(a => a.candidateId === viewCandidate.id)
              .map(a => {
                const job = jobs.find(j => j.id === a.jobId);
                return {
                  id: a.id,
                  jobTitle: job?.title || 'Unknown Job',
                  company: job?.company || 'Unknown Company',
                  status: a.status,
                  appliedAt: a.appliedAt,
                  feedback: a.feedback
                };
              })}
          />
      )}

      <CreateJobModal 
        isOpen={isJobModalOpen}
        onClose={() => setJobModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      {outreachModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-amber-50">
                      <div className="flex items-center gap-2">
                          <Sparkles size={18} className="text-amber-600" />
                          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">AI Outreach Draft</h3>
                      </div>
                      <button onClick={() => setOutreachModal(null)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Candidate: {outreachModal.candidateName}</p>
                      
                      {outreachModal.loading ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-4">
                              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Drafting personalized message...</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                  <textarea 
                                      className="w-full bg-transparent text-sm text-gray-700 leading-relaxed min-h-[200px] outline-none resize-none"
                                      value={outreachModal.message}
                                      onChange={(e) => setOutreachModal({...outreachModal, message: e.target.value})}
                                  />
                              </div>
                              <div className="flex gap-3">
                                  <button 
                                      onClick={() => {
                                          navigator.clipboard.writeText(outreachModal.message);
                                          alert("Copied to clipboard!");
                                      }}
                                      className="flex-1 py-3 text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors uppercase tracking-widest"
                                  >
                                      Copy to Clipboard
                                  </button>
                                  <button 
                                      onClick={() => setOutreachModal(null)}
                                      className="flex-1 py-3 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-100 transition-all uppercase tracking-widest"
                                  >
                                      Send Message
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Internal Bot helper
const Bot: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
  </svg>
);