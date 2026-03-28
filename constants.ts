import { Application, ApplicationStatus, Job, AvailabilitySlot, CareerPath, ExternalCandidate } from './types';

export const SUBSCRIPTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$49',
    features: ['3 Active AI Agents', '50 Outreach Credits', 'Weekly Scans', 'Basic Support'],
    limits: { maxAgents: 3, maxOutreachCredits: 50 }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$149',
    features: ['10 Active AI Agents', '250 Outreach Credits', 'Daily Scans', 'Priority Support', 'Explainable AI Scoring'],
    limits: { maxAgents: 10, maxOutreachCredits: 250 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: ['Unlimited AI Agents', 'Unlimited Outreach', 'Real-time 24/7 Sourcing', 'Dedicated Account Manager', 'Custom API Access'],
    limits: { maxAgents: 999, maxOutreachCredits: 9999 }
  }
];

export const MOCK_EXTERNAL_CANDIDATES: ExternalCandidate[] = [
  {
    id: 'ext1',
    name: 'Jordan Rivera',
    email: 'jordan.r@talent-pool.com',
    skills: ['React', 'Next.js', 'PostgreSQL', 'Cloud Infrastructure'],
    experience: '6 years',
    currentRole: 'Senior Frontend Lead',
    location: 'Remote'
  },
  {
    id: 'ext2',
    name: 'Sam Chen',
    email: 'sam.c@designers.hub',
    skills: ['Figma', 'User Research', 'Design Systems', 'Mobile App Design'],
    experience: '4 years',
    currentRole: 'UX Designer',
    location: 'San Francisco, CA'
  },
  {
    id: 'ext3',
    name: 'Taylor Brooks',
    email: 't.brooks@eng-net.org',
    skills: ['Go', 'Kubernetes', 'Microservices', 'Redis'],
    experience: '7 years',
    currentRole: 'Backend Architect',
    location: 'Austin, TX'
  }
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'j1',
    title: 'Senior Frontend Engineer',
    company: 'TechFlow Solutions',
    location: 'Remote',
    salary: '$140k - $180k',
    description: 'We are looking for an expert in React and TypeScript to lead our frontend initiatives.',
    requirements: ['5+ years React', 'TypeScript expert', 'Tailwind CSS'],
    responsibilities: [
      'Architect and build scalable frontend applications using React and TypeScript',
      'Collaborate with designers to implement pixel-perfect UIs',
      'Mentor junior developers and conduct code reviews'
    ],
    postedAt: '2 days ago',
    deadline: '2024-12-31',
    status: 'Open'
  },
  {
    id: 'j2',
    title: 'Product Designer',
    company: 'Creative Studio',
    location: 'New York, NY',
    salary: '$110k - $150k',
    description: 'Design intuitive and beautiful user experiences for our global client base.',
    requirements: ['Figma mastery', 'UX Research', 'Prototyping'],
    responsibilities: [
      'Create user flows, wireframes, and high-fidelity prototypes',
      'Conduct user research and usability testing',
      'Work closely with engineering to ensure design feasibility'
    ],
    postedAt: '1 week ago',
    deadline: '2024-11-15',
    status: 'Open'
  },
  {
    id: 'j3',
    title: 'Backend Developer (Go)',
    company: 'StreamLine',
    location: 'Austin, TX',
    salary: '$130k - $170k',
    description: 'Build high-performance microservices in Go.',
    requirements: ['Go', 'PostgreSQL', 'Docker'],
    responsibilities: [
      'Design and implement microservices in Go',
      'Optimize database queries and ensure system reliability',
      'Maintain CI/CD pipelines'
    ],
    postedAt: '3 days ago',
    status: 'Closed'
  },
  {
    id: 'j4',
    title: 'Frontend Developer',
    company: 'TechFlow Solutions',
    location: 'New York, NY',
    salary: '$120k - $150k',
    description: 'Join our NYC team to build amazing web experiences.',
    requirements: ['React', 'CSS', 'JavaScript'],
    responsibilities: ['Develop new features', 'Fix bugs', 'Collaborate with team'],
    postedAt: '5 days ago',
    status: 'Open'
  },
  {
    id: 'j5',
    title: 'DevOps Engineer',
    company: 'TechFlow Solutions',
    location: 'Remote',
    salary: '$150k - $190k',
    description: 'Scale our infrastructure and automate everything.',
    requirements: ['AWS', 'Kubernetes', 'Terraform'],
    responsibilities: ['Manage cloud infrastructure', 'Improve CI/CD', 'Security audits'],
    postedAt: '1 day ago',
    status: 'Open'
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'a1',
    jobId: 'j1',
    candidateId: 'c1',
    candidateName: 'Alex Johnson',
    candidateEmail: 'alex.j@example.com',
    appliedAt: '2023-10-25',
    status: ApplicationStatus.REVIEWING,
    skills: ['React', 'Node.js', 'AWS'],
    resumeLink: '#',
    aiScore: 85,
    aiReason: 'Strong match for React and Node.js. Experience level aligns with the Senior requirement.'
  },
  {
    id: 'a2',
    jobId: 'j1',
    candidateId: 'c2',
    candidateName: 'Sarah Smith',
    candidateEmail: 'sarah.s@example.com',
    appliedAt: '2023-10-24',
    status: ApplicationStatus.APPLIED,
    skills: ['Angular', 'Java', 'SQL'],
    resumeLink: '#',
    aiScore: 42,
    aiReason: 'Skills mismatch: Primary experience in Angular/Java while role requires React expert.'
  },
  {
    id: 'a3',
    jobId: 'j2',
    candidateId: 'c3',
    candidateName: 'Mike Brown',
    candidateEmail: 'mike.b@example.com',
    appliedAt: '2023-10-20',
    status: ApplicationStatus.REJECTED,
    feedback: 'While your portfolio is impressive, we are looking for someone with more specific experience in SaaS product design. We encourage you to apply for our Junior Designer role when it opens.',
    skills: ['Photoshop', 'Sketch'],
    resumeLink: '#',
    aiScore: 65,
    aiReason: 'Good design fundamentals but lacks Figma and UX research depth required for this role.'
  }
];

export const MOCK_AVAILABILITY: AvailabilitySlot[] = [
  {
    id: 's1',
    date: '2024-11-04',
    times: ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM']
  },
  {
    id: 's2',
    date: '2024-11-05',
    times: ['11:00 AM', '01:30 PM', '03:00 PM']
  },
  {
    id: 's3',
    date: '2024-11-06',
    times: ['09:30 AM', '10:00 AM', '01:00 PM', '04:00 PM']
  }
];

export const MOCK_CAREER_PATHS: CareerPath[] = [
  {
    id: 'cp1',
    name: 'Frontend Engineering',
    industry: 'Software Development',
    milestones: [
      {
        id: 'm1',
        level: 'Entry',
        title: 'Junior Frontend Developer',
        minSalary: 60000,
        maxSalary: 85000,
        avgYears: 1,
        requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React Basics'],
        certifications: ['Responsive Web Design (FreeCodeCamp)'],
        description: 'Focus on implementing UIs from designs and squashing bugs.'
      },
      {
        id: 'm2',
        level: 'Mid',
        title: 'Frontend Engineer',
        minSalary: 95000,
        maxSalary: 130000,
        avgYears: 3,
        requiredSkills: ['TypeScript', 'Testing (Jest)', 'Next.js', 'State Management'],
        certifications: ['Meta Front-End Developer Professional Certificate'],
        description: 'Own features end-to-end and optimize performance.'
      },
      {
        id: 'm3',
        level: 'Senior',
        title: 'Senior Frontend Engineer',
        minSalary: 145000,
        maxSalary: 190000,
        avgYears: 5,
        requiredSkills: ['System Design', 'Performance Optimization', 'Architecture', 'Mentorship'],
        certifications: ['AWS Certified Cloud Practitioner'],
        description: 'Lead architecture decisions and mentor the team.'
      },
      {
        id: 'm4',
        level: 'Leadership',
        title: 'Staff Engineer / Tech Lead',
        minSalary: 195000,
        maxSalary: 250000,
        avgYears: 8,
        requiredSkills: ['Strategic Planning', 'People Management', 'Cross-team Collab'],
        certifications: ['Project Management Professional (PMP)'],
        description: 'Drive long-term technical vision and align with business goals.'
      }
    ]
  },
  {
    id: 'cp2',
    name: 'Product Design',
    industry: 'Design',
    milestones: [
      {
        id: 'pd1',
        level: 'Entry',
        title: 'Junior Product Designer',
        minSalary: 55000,
        maxSalary: 80000,
        avgYears: 1,
        requiredSkills: ['Figma', 'Basic UX Principles', 'Prototyping'],
        certifications: ['Google UX Design Certificate'],
        description: 'Assist in creating user flows and high-fidelity screens.'
      },
      {
        id: 'pd2',
        level: 'Mid',
        title: 'Product Designer',
        minSalary: 90000,
        maxSalary: 125000,
        avgYears: 3,
        requiredSkills: ['User Research', 'Design Systems', 'Advanced Prototyping'],
        certifications: ['Interaction Design Foundation Specialist'],
        description: 'Lead design for complex features and conduct user testing.'
      },
      {
        id: 'pd3',
        level: 'Senior',
        title: 'Senior Product Designer',
        minSalary: 135000,
        maxSalary: 180000,
        avgYears: 6,
        requiredSkills: ['Strategy', 'Data-informed Design', 'Leadership'],
        certifications: ['NN/g UX Certification'],
        description: 'Set design standards and influence product roadmap.'
      }
    ]
  }
];