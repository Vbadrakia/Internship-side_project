import React, { useState, useMemo } from 'react';
import { Application, ApplicationStatus, Job, User } from '../types';
import { MapPin, DollarSign, Building, ChevronRight, Info, AlertCircle, X, CheckCircle2, Calendar, ListChecks, Clock, Video, TrendingUp, Briefcase, Target, Sparkles, Star } from 'lucide-react';
import { ApplyJobModal } from './ApplyJobModal';
import { InterviewScheduler } from './InterviewScheduler';
import { ReputationBadge } from './ReputationBadge';
import { calculateReputation } from '../utils/reputationUtils';
import { CareerMap } from './CareerMap';

interface CandidateDashboardProps {
  jobs: Job[];
  applications: Application[];
  onApply: (jobId: string, resume: File) => void;
  onConfirmInterview: (appId: string, date: string, time: string) => void;
  onRateFeedback: (appId: string, rating: number) => void;
  currentUser: User;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ jobs, applications, onApply, onConfirmInterview, onRateFeedback, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'career-map' | 'strategy'>('jobs');
  const [selectedFeedback, setSelectedFeedback] = useState<Application | null>(null);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);
  const [interviewCoachData, setInterviewCoachData] = useState<{ isOpen: boolean; content: string; isLoading: boolean }>({ isOpen: false, content: '', isLoading: false });
  const [strategyData, setStrategyData] = useState<{ content: string; isLoading: boolean; targetRole: string }>({ content: '', isLoading: false, targetRole: '' });

  const myApplications = applications.filter(a => a.candidateId === currentUser.id);
  const appliedJobIds = myApplications.map(a => a.jobId);

  const userSkills = useMemo(() => {
    // Collect all skills from their successful apps or profile
    const appSkills = myApplications.flatMap(a => a.skills);
    return Array.from(new Set([...(currentUser.skills || []), ...appSkills]));
  }, [myApplications, currentUser]);

  const recommendedJobs = useMemo(() => {
    if (userSkills.length === 0) return [];
    return jobs
      .filter(job => !appliedJobIds.includes(job.id))
      .map(job => {
        const matchCount = job.requirements.filter(req => 
          userSkills.some(skill => skill.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(skill.toLowerCase()))
        ).length;
        return { ...job, matchScore: (matchCount / job.requirements.length) * 100 };
      })
      .filter(job => job.matchScore > 30)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [jobs, userSkills, appliedJobIds]);

  const handleApplyClick = (job: Job) => {
    setApplyingJob(job);
  };

  const handleApplySubmit = (file: File) => {
    if (applyingJob) {
      onApply(applyingJob.id, file);
      setApplyingJob(null);
    }
  };

  const handleConfirmBooking = (date: string, time: string) => {
    if (schedulingApp) {
      onConfirmInterview(schedulingApp.id, date, time);
      setSchedulingApp(null);
    }
  };

  const handleGetInterviewCoach = async (job: Job) => {
    setInterviewCoachData({ isOpen: true, content: '', isLoading: true });
    try {
      const { generateInterviewCoach } = await import('../services/geminiService');
      const coachContent = await generateInterviewCoach(job.title, job.description);
      setInterviewCoachData({ isOpen: true, content: coachContent, isLoading: false });
    } catch (error) {
      console.error("Error getting coach:", error);
      setInterviewCoachData({ isOpen: true, content: "Failed to generate coaching tips. Please try again.", isLoading: false });
    }
  };

  const handleGenerateStrategy = async (targetRole: string) => {
    setStrategyData({ ...strategyData, isLoading: true, targetRole });
    try {
      const { generateCareerStrategy } = await import('../services/geminiService');
      const advice = await generateCareerStrategy(userSkills, targetRole);
      setStrategyData({ content: advice, isLoading: false, targetRole });
    } catch (error) {
      console.error("Error generating strategy:", error);
      setStrategyData({ ...strategyData, isLoading: false, content: "Failed to generate strategy. Please try again." });
    }
  };

  const getReputationForCompany = (company: string) => {
    const companyApps = applications.filter(a => {
        const job = jobs.find(j => j.id === a.jobId);
        return job?.company === company;
    });
    return calculateReputation(companyApps);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20 overflow-y-auto">
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex gap-6 justify-center">
            <button
                onClick={() => setActiveTab('jobs')}
                className={`pb-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'jobs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Briefcase size={16} /> Explore Jobs
            </button>
            <button
                onClick={() => setActiveTab('applications')}
                className={`pb-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Clock size={16} /> Applications
                {myApplications.length > 0 && <span className="ml-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{myApplications.length}</span>}
            </button>
            <button
                onClick={() => setActiveTab('career-map')}
                className={`pb-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'career-map' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Target size={16} /> Career Map
            </button>
            <button
                onClick={() => setActiveTab('strategy')}
                className={`pb-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'strategy' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Sparkles size={16} /> AI Strategy
            </button>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto w-full">
        {activeTab === 'strategy' ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-amber-100 mb-8 relative overflow-hidden">
                <div className="relative z-10">
                   <h2 className="text-2xl font-bold">AI Career Strategist</h2>
                   <p className="text-amber-100 mt-1 max-w-md">Get personalized advice on how to reach your next career milestone based on your current skills.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                   <Sparkles size={180} />
                </div>
             </div>

             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">What's your target role?</h3>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="e.g. Senior Frontend Engineer" 
                        className="flex-1 bg-gray-50 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                        value={strategyData.targetRole}
                        onChange={(e) => setStrategyData({ ...strategyData, targetRole: e.target.value })}
                    />
                    <button 
                        onClick={() => handleGenerateStrategy(strategyData.targetRole)}
                        disabled={strategyData.isLoading || !strategyData.targetRole}
                        className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        {strategyData.isLoading ? 'Analyzing...' : 'Generate Strategy'}
                    </button>
                </div>

                {strategyData.content && (
                    <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-800 font-bold mb-4">
                            <Target size={18} />
                            Your Personalized Path to {strategyData.targetRole}
                        </div>
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
                            {strategyData.content}
                        </div>
                    </div>
                )}
             </div>
          </div>
        ) : activeTab === 'career-map' ? (
          <div className="space-y-6">
             <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-violet-100 mb-8 relative overflow-hidden">
                <div className="relative z-10">
                   <h2 className="text-2xl font-bold">Visual Career Maps</h2>
                   <p className="text-violet-100 mt-1 max-w-md">Plot your professional future, identify skill gaps, and visualize your projected salary growth over time.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                   <Target size={180} />
                </div>
             </div>
             <CareerMap userSkills={userSkills} />
          </div>
        ) : activeTab === 'jobs' ? (
          <div className="space-y-6">
            {recommendedJobs.length > 0 && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-blue-800 font-bold mb-4">
                            <Sparkles size={18} className="text-blue-600" />
                            Recommended for You
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recommendedJobs.map(job => (
                                <div key={job.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden" onClick={() => handleApplyClick(job)}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 group-hover:bg-blue-100 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <h4 className="font-black text-gray-900 text-sm line-clamp-1 group-hover:text-blue-700 transition-colors">{job.title}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{job.company}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[14px] font-black text-blue-600 leading-none">{Math.round(job.matchScore)}%</span>
                                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Match</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {job.requirements.slice(0, 2).map(req => (
                                                <span key={req} className="text-[9px] font-black bg-blue-50/50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100/50 uppercase tracking-tight">{req}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4">
                        <Sparkles size={120} />
                    </div>
                </div>
            )}

            <div className="space-y-4">
            {jobs.map(job => {
              const reputation = getReputationForCompany(job.company);
              return (
              <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="flex items-center gap-1.5 text-gray-700 font-semibold text-sm">
                                <Building size={14} className="text-gray-400" /> {job.company}
                            </span>
                            <ReputationBadge stats={reputation} compact />
                        </div>
                    </div>
                    {appliedJobIds.includes(job.id) ? (
                        <span className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                          <CheckCircle2 size={12} /> Applied
                        </span>
                    ) : (
                        <button
                            onClick={() => handleApplyClick(job)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors shadow-sm shadow-blue-200"
                        >
                            Apply
                        </button>
                    )}
                </div>

                {reputation.responseRate > 90 && (
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-blue-800 bg-blue-50/50 px-3 py-2 rounded-xl border border-blue-100 font-bold animate-pulse-subtle">
                        <div className="bg-blue-600 p-1 rounded-lg text-white">
                            <TrendingUp size={12} />
                        </div>
                        <span>Highly Responsive: Provides feedback to {Math.round(reputation.responseRate)}% of candidates</span>
                    </div>
                )}
                
                <div className="mt-4 flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                    <span className="flex items-center gap-1"><DollarSign size={14} /> {job.salary}</span>
                    <span className="flex items-center gap-1 text-gray-400 text-xs"><Clock size={12} /> Posted: {job.postedAt}</span>
                </div>
                
                <p className="mt-4 text-sm text-gray-600 leading-relaxed line-clamp-2">{job.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                    {job.requirements.slice(0, 3).map(req => (
                        <span key={req} className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded text-xs border border-slate-100 font-medium">{req}</span>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      <div className="space-y-4 max-w-3xl mx-auto">
              {myApplications.length === 0 && (
                  <div className="text-center py-20">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Briefcase className="text-gray-300" size={24} />
                    </div>
                    <p className="text-gray-500 font-bold">You haven't applied to any jobs yet.</p>
                    <button onClick={() => setActiveTab('jobs')} className="text-blue-600 text-sm font-semibold mt-2 hover:underline">Start your transparent journey</button>
                  </div>
              )}
            {myApplications.map(app => {
                const job = jobs.find(j => j.id === app.jobId);
                const isRejected = app.status === ApplicationStatus.REJECTED;
                const isInterviewing = app.status === ApplicationStatus.INTERVIEWING;
                const isScheduled = app.status === ApplicationStatus.SCHEDULED;

                return (
                    <div 
                        key={app.id} 
                        className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all ${isRejected && app.feedback ? 'cursor-pointer hover:shadow-md hover:border-red-200' : ''}`}
                        onClick={() => {
                            if (isRejected && app.feedback) {
                                setSelectedFeedback(app);
                            }
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-gray-900">{job?.title}</h3>
                                <p className="text-sm text-gray-500">{job?.company}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
                                app.status === ApplicationStatus.REJECTED ? 'bg-red-50 text-red-600 border border-red-100' :
                                app.status === ApplicationStatus.OFFER ? 'bg-green-50 text-green-600 border border-green-100' :
                                app.status === ApplicationStatus.SCHEDULED ? 'bg-green-600 text-white' :
                                'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                                {app.status}
                            </span>
                        </div>

                        {isInterviewing && (
                          <div className="mt-4 bg-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-100 animate-pulse-subtle">
                             <div className="flex items-start gap-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                   <Calendar size={24} />
                                </div>
                                <div className="flex-1">
                                   <h4 className="font-bold">Next Step: Schedule Interview</h4>
                                   <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                                      The team at {job?.company} wants to talk to you! Pick a time that works best.
                                   </p>
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); setSchedulingApp(app); }}
                                      className="mt-4 bg-white text-blue-600 px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-md"
                                   >
                                      Book Now
                                   </button>
                                </div>
                             </div>
                          </div>
                        )}

                        {isScheduled && (
                          <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                                      <Video size={18} />
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Confirmed Interview</p>
                                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                        {new Date(app.interviewDate!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {app.interviewTime}
                                      </p>
                                   </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); job && handleGetInterviewCoach(job); }}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    <Sparkles size={14} /> AI Coach
                                </button>
                            </div>
                          </div>
                        )}

                        {app.status === ApplicationStatus.APPLIED && app.queuePosition && (
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                <ListChecks size={12} /> Queue Position: {app.queuePosition} of {app.totalApplicants || '...'}
                            </div>
                        )}

                        {isRejected && app.feedback && (
                            <div className="mt-3 bg-red-50/50 border border-red-100 rounded-lg p-3 group hover:bg-red-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                                        <Info className="text-red-600" size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Feedback Received</p>
                                        </div>
                                        <p className="text-sm text-gray-800 italic line-clamp-2 font-medium">"{app.feedback}"</p>
                                        <p className="text-xs text-red-600 mt-2 font-semibold flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            Tap to read full feedback <ChevronRight size={12} />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
          </div>
        )}
      </div>

      {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedFeedback(null)}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
                      <h3 className="font-bold text-red-800 flex items-center gap-2">
                          <Info size={18} />
                          Review Feedback
                      </h3>
                      <button onClick={() => setSelectedFeedback(null)} className="text-red-400 hover:text-red-700 rounded-full p-1 hover:bg-red-100">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-900 text-lg">{jobs.find(j => j.id === selectedFeedback.jobId)?.title}</h4>
                        <p className="text-sm text-gray-500">{jobs.find(j => j.id === selectedFeedback.jobId)?.company}</p>
                      </div>
                      
                      <div className="bg-red-50 p-5 rounded-xl border border-red-100 relative">
                          <div className="absolute top-4 left-4 text-red-200">
                              <Info size={24} />
                          </div>
                          <div className="relative z-10 pl-8">
                             <p className="text-gray-800 italic leading-relaxed text-sm md:text-base font-medium">
                                "{selectedFeedback.feedback}"
                             </p>
                          </div>
                      </div>

                      <div className="mt-6">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rate this feedback's helpfulness</p>
                          <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                      key={star}
                                      onClick={() => {
                                          onRateFeedback(selectedFeedback.id, star);
                                          setSelectedFeedback(null);
                                      }}
                                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                          (selectedFeedback.feedbackRating || 0) >= star
                                          ? 'bg-amber-100 text-amber-600 border-amber-200'
                                          : 'bg-gray-50 text-gray-300 border-gray-100 hover:bg-gray-100'
                                      } border`}
                                  >
                                      <TrendingUp size={18} className={star <= (selectedFeedback.feedbackRating || 0) ? 'fill-amber-600' : ''} />
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {interviewCoachData.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setInterviewCoachData({ ...interviewCoachData, isOpen: false })}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                      <h3 className="font-bold flex items-center gap-2">
                          <Sparkles size={18} />
                          AI Interview Coach
                      </h3>
                      <button onClick={() => setInterviewCoachData({ ...interviewCoachData, isOpen: false })} className="text-white/70 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                      {interviewCoachData.isLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-4">
                              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                              <p className="text-gray-500 font-medium animate-pulse">Analyzing job requirements...</p>
                          </div>
                      ) : (
                          <div className="prose prose-sm max-w-none">
                              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                                  {interviewCoachData.content}
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                      <button 
                          onClick={() => setInterviewCoachData({ ...interviewCoachData, isOpen: false })}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                      >
                          Got it, thanks!
                      </button>
                  </div>
              </div>
          </div>
      )}

      {applyingJob && (
        <ApplyJobModal
          isOpen={!!applyingJob}
          onClose={() => setApplyingJob(null)}
          onSubmit={handleApplySubmit}
          jobTitle={applyingJob.title}
          companyName={applyingJob.company}
        />
      )}

      {schedulingApp && (
        <InterviewScheduler 
          isOpen={!!schedulingApp}
          onClose={() => setSchedulingApp(null)}
          onConfirm={handleConfirmBooking}
          candidateName={schedulingApp.candidateName}
          jobTitle={jobs.find(j => j.id === schedulingApp.jobId)?.title || 'Job'}
        />
      )}
    </div>
  );
};