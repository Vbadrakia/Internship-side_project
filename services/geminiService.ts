import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { FeedbackRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRejectionFeedback = async (request: FeedbackRequest): Promise<string> => {
  try {
    const prompt = `
      You are a professional and empathetic HR recruiter.
      Task: Write a rejection feedback message for a candidate.
      
      Candidate Name: ${request.candidateName}
      Job Title: ${request.jobTitle}
      Reasons for rejection: ${request.reasons.join(', ')}
      Desired Tone: ${request.tone}
      
      Requirements:
      1. Be transparent but kind.
      2. Specifically mention the reasons provided to give closure.
      3. Keep it under 80 words.
      4. Do not use a generic "boilerplate" opening if possible, make it sound personal.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Thank you for your application. Unfortunately, we have decided to move forward with other candidates.";
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Thank you for applying. At this time, we have decided to pursue other candidates whose skills more closely match our current needs.";
  }
};

export const generateCareerStrategy = async (currentSkills: string[], targetRole: string): Promise<string> => {
  try {
    const prompt = `
      You are a career growth advisor. 
      Analyze the candidate's skills: ${currentSkills.join(', ')}.
      Target role: ${targetRole}.
      
      Task:
      1. Identify the top 3 skill gaps.
      2. Recommend 2 specific learning resources or projects.
      3. Provide a motivational "next step".
      Keep it professional, actionable, and under 100 words.
      Format the output with clean line breaks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Analyze your skill gaps and start a project in that area.";
  } catch (error) {
    console.error("Error generating career advice:", error);
    return "Keep learning and building projects to reach your target role.";
  }
};

export interface AIScoreResponse {
  score: number;
  reason: string;
}

export const scoreCandidateMatch = async (candidateData: any, jobData: any): Promise<AIScoreResponse> => {
  try {
    const prompt = `
      You are an AI Talent Sourcing Expert.
      Analyze the candidate against the job description and provide a match score (0-100) and a concise reason.

      CANDIDATE:
      - Skills: ${candidateData.skills?.join(', ')}
      - Experience: ${candidateData.experience || 'Not specified'}
      - Role: ${candidateData.currentRole || 'Not specified'}

      JOB:
      - Title: ${jobData.title}
      - Requirements: ${jobData.requirements?.join(', ')}
      - Responsibilities: ${jobData.responsibilities?.join(', ')}

      Return a JSON object with:
      "score": number,
      "reason": string (max 30 words)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["score", "reason"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"score": 50, "reason": "Moderate match based on fundamentals."}');
    return result;
  } catch (error) {
    console.error("Error scoring candidate:", error);
    return { score: 50, reason: "Manual review recommended due to analysis error." };
  }
};

export const generateInterviewCoach = async (jobTitle: string, jobDescription: string): Promise<string> => {
  try {
    const prompt = `
      You are an AI Interview Coach.
      Target Role: ${jobTitle}
      Job Description: ${jobDescription}
      
      Task:
      1. Generate 3 mock interview questions tailored to this specific role.
      2. For each question, provide a "Pro-Tip" on how to answer it effectively.
      Keep it encouraging and under 150 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Prepare for questions about your technical skills and past projects.";
  } catch (error) {
    console.error("Error generating interview coach:", error);
    return "Prepare for questions about your technical skills and past projects.";
  }
};

export const draftOutreachMessage = async (candidateName: string, jobTitle: string, matchReason: string): Promise<string> => {
  try {
    const prompt = `
      You are a recruiter at a top tech company.
      Candidate: ${candidateName}
      Role: ${jobTitle}
      AI Match Reason: ${matchReason}
      
      Task:
      Write a personalized, professional, and warm outreach message to invite them to apply.
      Mention that our AI identified them as a high-fit match.
      Keep it under 60 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || `Hi ${candidateName}, I'm reaching out because your profile is a great match for our ${jobTitle} role!`;
  } catch (error) {
    console.error("Error drafting outreach:", error);
    return `Hi ${candidateName}, I'm reaching out because your profile is a great match for our ${jobTitle} role!`;
  }
};

export const parseResume = async (resumeText: string): Promise<{ skills: string[], summary: string }> => {
  try {
    const prompt = `
      Extract professional skills and a 1-sentence summary from this resume text:
      ${resumeText}
      
      Return a JSON object with:
      "skills": string[] (max 10),
      "summary": string
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["skills", "summary"]
        }
      }
    });

    return JSON.parse(response.text || '{"skills": [], "summary": ""}');
  } catch (error) {
    console.error("Error parsing resume:", error);
    return { skills: [], summary: "" };
  }
};

export const generateJobDescription = async (title: string, company: string, location: string): Promise<{ description: string, requirements: string[], responsibilities: string[] }> => {
  try {
    const prompt = `
      You are an expert technical recruiter.
      Task: Generate a professional job description, requirements, and responsibilities for a new role.
      
      Job Title: ${title}
      Company: ${company}
      Location: ${location}
      
      Return a JSON object with:
      "description": string (approx 100 words),
      "requirements": string[] (max 6),
      "responsibilities": string[] (max 6)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["description", "requirements", "responsibilities"]
        }
      }
    });

    return JSON.parse(response.text || '{"description": "", "requirements": [], "responsibilities": []}');
  } catch (error) {
    console.error("Error generating JD:", error);
    return { description: "", requirements: [], responsibilities: [] };
  }
};

/**
 * High Thinking Mode for complex queries.
 * Uses gemini-3.1-pro-preview with ThinkingLevel.HIGH.
 */
export const generateHighThinkingAdvice = async (query: string, context: string): Promise<string> => {
  try {
    const prompt = `
      You are a Senior Strategic Talent Advisor. 
      Context: ${context}
      Query: ${query}
      
      Task: Provide a deep, strategic analysis and recommendation. 
      Consider long-term implications, market trends, and organizational fit.
      Be detailed and insightful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    return response.text?.trim() || "I'm analyzing your request. Please provide more details for a deeper strategy.";
  } catch (error) {
    console.error("Error in High Thinking mode:", error);
    return "I encountered an error while processing your complex request. Let's try a simpler approach first.";
  }
};

/**
 * Multi-turn chat interface using Gemini.
 */
export const startChat = (systemInstruction: string) => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};
