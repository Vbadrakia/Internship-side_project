import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, Sparkles } from 'lucide-react';

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
  jobTitle: string;
  companyName: string;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({ isOpen, onClose, onSubmit, jobTitle, companyName }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<{ skills: string[], summary: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = async (selectedFile: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      
      // Simulate AI Parsing
      setIsParsing(true);
      try {
        const { parseResume } = await import('../services/geminiService');
        // In a real app, we'd extract text from the file first.
        // Here we simulate with a mock text based on the file name or just generic.
        const mockText = "Experience in React, TypeScript, and Node.js. Built several scalable web applications.";
        const result = await parseResume(mockText);
        setParsedData(result);
      } catch (error) {
        console.error("Error parsing resume:", error);
      } finally {
        setIsParsing(false);
      }
    } else {
      alert("Please upload a PDF or DOCX file.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit(file);
      setFile(null);
      setParsedData(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-semibold text-gray-900">Apply for Position</h3>
            <p className="text-xs text-gray-500">{jobTitle} at {companyName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume (PDF, DOCX)
            </label>
            
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : file 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleChange} 
              />
              
              {!file ? (
                <div className="flex flex-col items-center justify-center cursor-pointer" onClick={() => inputRef.current?.click()}>
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <UploadCloud className="text-blue-600" size={24} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF or DOCX (max. 5MB)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <CheckCircle2 className="text-green-600" size={24} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setFile(null); setParsedData(null); }}
                    className="text-xs text-red-500 hover:underline mt-2 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>
          </div>

          {isParsing && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">AI Parsing Resume...</p>
              </div>
          )}

          {parsedData && !isParsing && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-blue-600" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Extracted Profile</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mb-3 leading-relaxed">"{parsedData.summary}"</p>
                  <div className="flex flex-wrap gap-1.5">
                      {parsedData.skills.map(skill => (
                          <span key={skill} className="text-[9px] bg-white text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                              {skill}
                          </span>
                      ))}
                  </div>
              </div>
          )}

          <div className="flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!file}
              className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};