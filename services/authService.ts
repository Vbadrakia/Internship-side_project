import { User } from "../types";

// Mock database
const MOCK_USERS: User[] = [
  {
    id: 'c1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'candidate',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff',
    settings: { darkMode: false }
  },
  {
    id: 'c2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    role: 'candidate',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=random',
    settings: { darkMode: false }
  },
  {
    id: 'r1',
    name: 'John Recruiter',
    email: 'john@techflow.com',
    role: 'recruiter',
    company: 'TechFlow Solutions',
    avatar: 'https://ui-avatars.com/api/?name=John+Recruiter&background=2563EB&color=fff',
    settings: { darkMode: false, blindHiring: false }
  }
];

export const login = async (email: string, role: 'candidate' | 'recruiter'): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
  
  if (!user) {
    throw new Error("Invalid credentials or user not found.");
  }
  
  return user;
};

export const register = async (name: string, email: string, role: 'candidate' | 'recruiter', company?: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (MOCK_USERS.find(u => u.email === email)) {
    throw new Error("User already exists with this email.");
  }

  const newUser: User = {
    id: role === 'candidate' ? `c${Date.now()}` : `r${Date.now()}`,
    name,
    email,
    role,
    company: role === 'recruiter' ? company : undefined,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    settings: { darkMode: false, blindHiring: role === 'recruiter' ? false : undefined }
  };

  MOCK_USERS.push(newUser);
  return newUser;
};