export interface PDFDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Question {
  id: string;
  type: 'mcq' | 'saq' | 'laq';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  pdfId: string;
  questions: Question[];
  userAnswers: { [questionId: string]: string };
  score: number;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: { page: number; text: string }[];
}
