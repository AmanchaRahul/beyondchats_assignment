'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';

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
      setError('PDF content is too short.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswers({});
      setShowResults(false);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate quiz';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach(q => {
      const userAnswer = userAnswers[q.id]?.trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      if (userAnswer === correctAnswer) correct++;
    });
    
    const finalScore = (correct / questions.length) * 100;
    setScore(finalScore);
    setShowResults(true);

    try {
      await fetch('/api/save-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_id: pdfId,
          questions,
          user_answers: userAnswers,
          score: finalScore,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (_error) {
      console.error('Failed to save attempt');
    }
  };

  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
            <p className="text-gray-400">Generating quiz questions...</p>
            <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={generateQuiz} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Ready to test your knowledge?
            </h3>
            <p className="text-gray-400 mb-6">
              Generate a comprehensive quiz from your PDF
            </p>
            <Button onClick={generateQuiz} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Generate Quiz
            </Button>
            <p className="text-xs text-gray-500 mt-3">10 MCQs • 10 SAQs • 10 LAQs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 text-emerald-400">{score.toFixed(1)}%</div>
              <Progress value={score} className="h-3 mb-2" />
              <p className="text-sm text-gray-400">
                {Math.round((score / 100) * questions.length)} out of {questions.length} correct
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[q.id] || 'Not answered';
            const isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
            
            return (
              <Card key={q.id} className="bg-[#1a1a1a] border-gray-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white">Q{idx + 1}.</span>
                        <Badge variant="outline" className="text-xs bg-gray-800 text-gray-300">
                          {q.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-medium text-gray-200 mb-3">{q.question}</p>
                      <div className="text-sm space-y-2">
                        <p className="text-gray-400">
                          <strong className="text-gray-300">Your answer:</strong> {userAnswer}
                        </p>
                        <p className="text-green-400">
                          <strong>Correct:</strong> {q.correctAnswer}
                        </p>
                        <div className="bg-[#0a0a0a] border border-gray-800 p-3 rounded-lg mt-2">
                          <p className="text-xs text-gray-500 font-medium mb-1">EXPLANATION</p>
                          <p className="text-gray-300 text-sm">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button 
          onClick={() => generateQuiz()} 
          size="lg" 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Generate New Quiz
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            Question {currentIndex + 1} of {questions.length}
          </CardTitle>
          <Badge variant="outline" className="bg-gray-800 text-gray-300">
            {currentQuestion.type.toUpperCase()}
          </Badge>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-lg font-medium text-gray-200">{currentQuestion.question}</p>

        {currentQuestion.type === 'mcq' && currentQuestion.options ? (
          <RadioGroup
            value={userAnswers[currentQuestion.id] || ''}
            onValueChange={(value) =>
              setUserAnswers({ ...userAnswers, [currentQuestion.id]: value })
            }
          >
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-3 border border-gray-700 rounded-lg p-3 hover:bg-gray-800/50 transition-colors">
                  <RadioGroupItem value={option} id={`${currentQuestion.id}-${idx}`} className="text-emerald-500" />
                  <Label htmlFor={`${currentQuestion.id}-${idx}`} className="flex-1 cursor-pointer text-gray-200">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <Textarea
            placeholder="Type your answer..."
            value={userAnswers[currentQuestion.id] || ''}
            onChange={(e) =>
              setUserAnswers({ ...userAnswers, [currentQuestion.id]: e.target.value })
            }
            rows={currentQuestion.type === 'laq' ? 6 : 3}
            className="bg-[#0a0a0a] border-gray-700 text-gray-200 placeholder:text-gray-500"
          />
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="bg-[#2f2f2f] border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white disabled:bg-gray-800 disabled:text-gray-600"
          >
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button 
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
