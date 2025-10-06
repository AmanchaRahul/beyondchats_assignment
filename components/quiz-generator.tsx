'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'mcq' | 'saq' | 'laq';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizGeneratorProps {
  pdfId: string;
  content: string;
}

export function QuizGenerator({ pdfId, content }: QuizGeneratorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    if (!content || content.length < 100) {
      setError('PDF content is too short. Please upload a larger document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Generating quiz from content length:', content.length);
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate quiz');
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions generated');
      }

      console.log('Quiz generated successfully:', data.questions.length, 'questions');
      setQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswers({});
      setShowResults(false);
      
    } catch (error: any) {
      console.error('Failed to generate quiz:', error);
      setError(error.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach(q => {
      const userAnswer = userAnswers[q.id]?.trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      
      if (userAnswer === correctAnswer) {
        correct++;
      }
    });
    
    const finalScore = (correct / questions.length) * 100;
    setScore(finalScore);
    setShowResults(true);

    // Save attempt to Supabase
    try {
      await fetch('/api/save-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_id: pdfId,
          questions: questions,
          user_answers: userAnswers,
          score: finalScore,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to save attempt:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Generating quiz questions...</p>
            <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generateQuiz}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Ready to test your knowledge?
            </p>
            <Button onClick={generateQuiz} size="lg" className="w-full">
              Generate Quiz (30 Questions)
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              10 MCQs -  10 SAQs -  10 LAQs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-5xl font-bold mb-2 text-blue-600">
                {score.toFixed(1)}%
              </div>
              <Progress value={score} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">
                {Math.round((score / 100) * questions.length)} out of {questions.length} correct
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-4">
              {questions.map((q, idx) => {
                const userAnswer = userAnswers[q.id] || 'Not answered';
                const isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                
                return (
                  <div key={q.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Q{idx + 1}.</span>
                          <Badge variant="outline" className="text-xs">
                            {q.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="font-medium mb-2">{q.question}</p>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">
                            <strong>Your answer:</strong> {userAnswer}
                          </p>
                          <p className="text-green-600">
                            <strong>Correct answer:</strong> {q.correctAnswer}
                          </p>
                          <p className="text-gray-700 bg-gray-50 p-2 rounded mt-2">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={() => generateQuiz()} className="w-full" size="lg">
              Generate New Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Question {currentIndex + 1} of {questions.length}</CardTitle>
          <Badge variant="outline">
            {currentQuestion.type.toUpperCase()}
          </Badge>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{currentQuestion.question}</p>

        {currentQuestion.type === 'mcq' && currentQuestion.options ? (
          <RadioGroup
            value={userAnswers[currentQuestion.id] || ''}
            onValueChange={(value) =>
              setUserAnswers({ ...userAnswers, [currentQuestion.id]: value })
            }
          >
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2 border rounded p-3 hover:bg-gray-50">
                  <RadioGroupItem value={option} id={`${currentQuestion.id}-option-${idx}`} />
                  <Label htmlFor={`${currentQuestion.id}-option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <Textarea
            placeholder="Type your answer here..."
            value={userAnswers[currentQuestion.id] || ''}
            onChange={(e) =>
              setUserAnswers({ ...userAnswers, [currentQuestion.id]: e.target.value })
            }
            rows={currentQuestion.type === 'laq' ? 6 : 3}
            className="resize-none"
          />
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex(prev => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Submit Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
