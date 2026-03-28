import React, { useState, useEffect, Component, ReactNode } from 'react';
import { MOCK_APPLICATIONS, MOCK_JOBS } from './constants';
import { Application, ApplicationStatus, User, Job } from './types';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { CandidateDashboard } from './components/CandidateDashboard';
import { AuthScreen } from './components/AuthScreen';
import { LayoutGrid, User as UserIcon, ShieldCheck, LogOut, ChevronRight, Moon, Sun, MessageCircle, X, Sparkles, Zap, Trash2 } from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, onSnapshot, query, where, writeBatch, getDocs, updateDoc } from 'firebase/firestore';
import { startChat, parseResume, scoreCandidateMatch, generateHighThinkingAdvice } from './services/geminiService';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<any, any> {
  state: any = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): any {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <X size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Application Error</h2>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authRole, setAuthRole] = useState<'candidate' | 'recruiter' | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // New user - handled by handleLogin or role selection
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth Listener Error:", error);
        // Don't throw here to avoid infinite loop, just log
      } finally {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    if (!isAuthReady || !user) {
      setJobs([]);
      setApplications([]);
      return;
    }

    // Jobs are public to all authenticated users
    const jobsUnsubscribe = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const jobsData = snapshot.docs.map(doc => doc.data() as Job);
      setJobs(jobsData);
    }, (error) => {
      console.error("Jobs Sync Error:", error);
      // Only handle if it's a real error, not just initial load
      if (user) handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    // Applications are scoped: candidates see theirs, recruiters see all (or filtered by job)
    const appsQuery = user.role === 'recruiter' 
      ? collection(db, 'applications') 
      : query(collection(db, 'applications'), where('candidateId', '==', user.id));

    const appsUnsubscribe = onSnapshot(appsQuery, (snapshot) => {
      const appsData = snapshot.docs.map(doc => doc.data() as Application);
      setApplications(appsData);
    }, (error) => {
      console.error("Apps Sync Error:", error);
      if (user) handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return () => {
      jobsUnsubscribe();
      appsUnsubscribe();
    };
  }, [isAuthReady, user?.id, user?.role]);

  // Initial Migration (Demo only)
  useEffect(() => {
    const migrate = async () => {
      try {
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        if (jobsSnap.empty) {
          const batch = writeBatch(db);
          MOCK_JOBS.forEach(job => {
            batch.set(doc(db, 'jobs', job.id), job);
          });
          MOCK_APPLICATIONS.forEach(app => {
            batch.set(doc(db, 'applications', app.id), app);
          });
          await batch.commit();
        }
      } catch (error) {
        console.error("Migration Error:", error);
      }
    };
    if (isAuthReady && user) migrate();
  }, [isAuthReady, user]);

  const handleLogin = async (role: 'candidate' | 'recruiter') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      } else {
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Anonymous',
          email: firebaseUser.email || '',
          role: role,
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=random`,
          settings: { darkMode: false, blindHiring: role === 'recruiter' ? false : undefined }
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        setUser(newUser);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Failed to sign in. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAuthRole(null);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleBlindHiring = async () => {
    if (!user || user.role !== 'recruiter') return;
    const updatedSettings = { ...user.settings, blindHiring: !user.settings?.blindHiring };
    try {
      await setDoc(doc(db, 'users', user.id), { ...user, settings: updatedSettings });
      setUser({ ...user, settings: updatedSettings });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus, feedback?: string) => {
    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, { 
        status, 
        feedback,
        lastStatusUpdateAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const handleRateFeedback = async (appId: string, rating: number) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { feedbackRating: rating });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const handleShareWithHM = async (appId: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { isSharedWithHM: true });
      alert("Candidate profile shared with Hiring Manager!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const handleApply = async (jobId: string, resumeFile: File) => {
    if (!user) return;
    
    if (applications.some(a => a.jobId === jobId && a.candidateId === user.id)) {
        alert("You have already applied for this job.");
        return;
    }

    try {
      // 1. Read file content (assuming text for demo, in real app use PDF parser)
      const reader = new FileReader();
      const resumeText = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string || "");
        reader.readAsText(resumeFile);
      });

      // 2. Parse with AI
      const { skills, summary } = await parseResume(resumeText || "Experience in React and TypeScript development.");
      
      const resumeLink = URL.createObjectURL(resumeFile);
      const appId = `app_${Date.now()}`;

      const newApp: Application = {
        id: appId,
        jobId: jobId,
        candidateId: user.id,
        candidateName: user.name,
        candidateEmail: user.email,
        appliedAt: new Date().toISOString(),
        status: ApplicationStatus.APPLIED,
        skills: skills.length > 0 ? skills : ['React', 'TypeScript'],
        resumeSummary: summary,
        resumeLink: resumeLink
      };

      // 3. Save application
      await setDoc(doc(db, 'applications', appId), newApp);

      // 4. Update user skills if needed
      const updatedSkills = Array.from(new Set([...(user.skills || []), ...skills]));
      if (updatedSkills.length > (user.skills?.length || 0)) {
        await updateDoc(doc(db, 'users', user.id), { skills: updatedSkills });
        setUser({ ...user, skills: updatedSkills });
      }

      alert("Application submitted successfully! AI has parsed your resume and updated your profile skills.");
    } catch (error) {
      console.error("Application Error:", error);
      handleFirestoreError(error, OperationType.CREATE, `applications/new`);
    }
  };

  const handleConfirmInterview = async (appId: string, date: string, time: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { 
        status: ApplicationStatus.SCHEDULED, 
        interviewDate: date, 
        interviewTime: time,
        lastStatusUpdateAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const handleScoreCandidate = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const job = jobs.find(j => j.id === app.jobId);
    if (!job) return;

    try {
      const { score, reason } = await scoreCandidateMatch(
        { skills: app.skills, experience: app.resumeSummary || 'Not specified' },
        { title: job.title, requirements: job.requirements, responsibilities: job.responsibilities }
      );

      await updateDoc(doc(db, 'applications', appId), { 
        aiScore: score, 
        aiReason: reason 
      });
    } catch (error) {
      console.error("Scoring Error:", error);
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const handleAddJob = async (jobData: Omit<Job, 'id' | 'status'>) => {
    const jobId = `j${Date.now()}`;
    const newJob: Job = {
        ...jobData,
        id: jobId,
        status: 'Open'
    };
    try {
      await setDoc(doc(db, 'jobs', jobId), newJob);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `jobs/${jobId}`);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (!user || user.role !== 'recruiter') return;
    
    const maxAgents = tier === 'basic' ? 3 : tier === 'pro' ? 10 : 999;
    const maxCredits = tier === 'basic' ? 50 : tier === 'pro' ? 250 : 9999;
    
    const newSubscription = {
      tier: (tier.charAt(0).toUpperCase() + tier.slice(1)) as any,
      status: 'active' as const,
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage: {
        activeAgents: 0,
        maxAgents,
        outreachCredits: 0,
        maxOutreachCredits: maxCredits
      }
    };
    
    try {
      await updateDoc(doc(db, 'users', user.id), { subscription: newSubscription });
      setUser({ ...user, subscription: newSubscription });
      alert(`Successfully subscribed to ${tier.toUpperCase()} plan!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (authRole && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Sign in as {authRole}</h2>
          <button
            onClick={() => handleLogin(authRole)}
            className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
          >
            <ShieldCheck size={24} />
            Continue with Google
          </button>
          <button
            onClick={() => setAuthRole(null)}
            className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600"
          >
            Back to role selection
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-xl shadow-blue-200 transform -rotate-3 hover:rotate-0 transition-transform">
                <ShieldCheck className="text-white" size={40} />
            </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">ClearPath Recruit</h1>
          <p className="text-gray-500 mb-10 font-medium leading-relaxed">The transparent recruitment platform where feedback is standard, not optional.</p>
          
          <div className="space-y-4">
            <button
              onClick={() => setAuthRole('recruiter')}
              className="w-full py-5 px-6 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all group flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <LayoutGrid size={24} className="text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                    <span className="block font-black text-gray-900 group-hover:text-blue-700 text-lg">I am a Recruiter</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Manage jobs & track reputation</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-400" />
            </button>
            <button
              onClick={() => setAuthRole('candidate')}
              className="w-full py-5 px-6 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all group flex items-center justify-between text-left"
            >
               <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <UserIcon size={24} className="text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                    <span className="block font-black text-gray-900 group-hover:text-blue-700 text-lg">I am a Candidate</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Find responsive companies</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                         <ShieldCheck className="text-white" size={20} />
                    </div>
                    <span className="font-bold text-gray-900 tracking-tight">ClearPath</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleDarkMode}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="flex items-center gap-2">
                        {user.avatar && <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" />}
                        <div className="hidden sm:block text-right">
                             <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                             <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{user.role}</div>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>

      <main className="flex-1 overflow-hidden relative">
        {user.role === 'recruiter' ? (
          <RecruiterDashboard
            jobs={jobs}
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            onAddJob={handleAddJob}
            onSubscribe={handleSubscribe}
            onToggleBlindHiring={toggleBlindHiring}
            onShareWithHM={handleShareWithHM}
            onScoreCandidate={handleScoreCandidate}
            currentUser={user}
          />
        ) : (
          <CandidateDashboard
            jobs={jobs}
            applications={applications}
            onApply={handleApply}
            onConfirmInterview={handleConfirmInterview}
            onRateFeedback={handleRateFeedback}
            currentUser={user}
          />
        )}

        {/* Floating AI Chatbot Toggle */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>

        {isChatOpen && (
          <ChatBot user={user} onClose={() => setIsChatOpen(false)} />
        )}
      </main>
    </div>
    </ErrorBoundary>
  );
};

// Simple ChatBot Component
const ChatBot: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string; isThinking?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [isHighThinking, setIsHighThinking] = useState(false);

  useEffect(() => {
    const systemInstruction = `You are ClearPath AI, a helpful assistant for the ClearPath Recruit platform. 
    You help ${user.role}s with their tasks. 
    If they are a recruiter, help with job descriptions, outreach, and candidate analysis.
    If they are a candidate, help with resume tips, interview prep, and career advice.
    Be professional, encouraging, and concise.`;
    setChat(startChat(systemInstruction));
  }, [user]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      if (isHighThinking) {
        const context = `User Role: ${user.role}. Current user name: ${user.name}. App: ClearPath Recruit.`;
        const response = await generateHighThinkingAdvice(userMsg, context);
        setMessages(prev => [...prev, { role: 'model', content: response, isThinking: true }]);
      } else if (chat) {
        const response = await chat.sendMessage({ message: userMsg });
        setMessages(prev => [...prev, { role: 'model', content: response.text || "I'm sorry, I couldn't process that." }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Error connecting to AI. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
      <div className={`p-4 border-b border-gray-100 flex items-center justify-between transition-colors duration-500 ${isHighThinking ? 'bg-amber-500' : 'bg-blue-600'}`}>
        <div className="flex items-center gap-2 text-white">
          <div className="relative">
            <ShieldCheck size={20} />
            {isHighThinking && (
              <div className="absolute -top-1 -right-1 bg-white text-amber-600 rounded-full p-0.5 animate-pulse">
                <Zap size={8} />
              </div>
            )}
          </div>
          <span className="font-black text-sm uppercase tracking-widest">ClearPath AI</span>
          <button 
            onClick={() => setIsHighThinking(!isHighThinking)}
            className={`ml-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition-all flex items-center gap-1 ${isHighThinking ? 'bg-white text-amber-600' : 'bg-blue-500 text-blue-100'}`}
            title="Toggle High Thinking Mode"
          >
            {isHighThinking && <Zap size={8} />}
            {isHighThinking ? 'Strategic' : 'Normal'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button 
              onClick={() => setMessages([])} 
              className="text-white/60 hover:text-white transition-colors"
              title="Clear Chat"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="relative inline-block mb-4">
              <Sparkles size={48} className={`mx-auto opacity-20 ${isHighThinking ? 'text-amber-500' : 'text-blue-500'}`} />
              {isHighThinking && <Zap size={16} className="absolute top-0 right-0 text-amber-500 animate-bounce" />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">How can I help you today?</p>
            {isHighThinking && (
              <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-[9px] text-amber-700 font-black uppercase tracking-widest leading-relaxed">
                  Strategic Mode Active: Using Gemini 3.1 Pro for deep reasoning and complex problem solving.
                </p>
              </div>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm relative ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {msg.isThinking && (
                <div className="absolute -top-2 -left-2 bg-amber-400 text-amber-900 p-1 rounded-full shadow-sm">
                  <Zap size={10} />
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none animate-pulse">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
