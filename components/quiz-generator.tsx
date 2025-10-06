'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Question } from '@/lib/types';

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

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      setQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswers({});
      setShowResults(false);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) correct++;
    });
    
    const finalScore = (correct / questions.length) * 100;
    setScore(finalScore);
    setShowResults(true);

    // Save attempt to Supabase
    await fetch('/api/save-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfId,
        questions,
        userAnswers,
        score: finalScore,
        timestamp: new Date().toISOString(),
      }),
    });
  };

  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={generateQuiz} className="w-full">
            Generate Quiz (30 Questions)
          </Button>
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
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{score.toFixed(1)}%</div>
              <Progress value={score} className="h-2" />
            </div>

            {questions.map((q, idx) => {
              const isCorrect = userAnswers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className="border-t pt-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{idx + 1}. {q.question}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your answer: {userAnswers[q.id] || 'Not answered'}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Correct answer: {q.correctAnswer}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <Button onClick={() => generateQuiz()} className="w-full">
              Generate New Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Question {currentIndex + 1} of {questions.length}</CardTitle>
          <Badge variant="outline">
            {currentQuestion.type.toUpperCase()}
          </Badge>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} />
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
            {currentQuestion.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Textarea
            placeholder="Type your answer here..."
            value={userAnswers[currentQuestion.id] || ''}
            onChange={(e) =>
              setUserAnswers({ ...userAnswers, [currentQuestion.id]: e.target.value })
            }
            rows={currentQuestion.type === 'laq' ? 6 : 3}
          />
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(prev => prev + 1)}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Submit Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
