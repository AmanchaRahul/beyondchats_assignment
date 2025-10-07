'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Target, Loader2, Trophy } from 'lucide-react';

interface AttemptData {
  id: string;
  score: number;
  timestamp: string;
  pdf_id: string;
}

interface ProgressDashboardProps {
  pdfId?: string;
}

export function ProgressDashboard({ pdfId }: ProgressDashboardProps) {
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [pdfId]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const url = pdfId
        ? `/api/get-progress?pdfId=${pdfId}`
        : '/api/get-progress';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAttempts(data.attempts || []);
      }
    } catch (error) {
      console.error('Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  };

  const averageScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
    : 0;

  const recentAttempts = attempts.slice(0, 5);
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;

  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Progress</h2>
        <p className="text-gray-400">Track your learning journey and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Average Score</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{averageScore.toFixed(1)}%</div>
            <Progress value={averageScore} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{attempts.length}</div>
            <p className="text-xs text-gray-400 mt-2">Quizzes completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Best Score</CardTitle>
            <Trophy className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{bestScore.toFixed(1)}%</div>
            <p className="text-xs text-gray-400 mt-2">Personal best</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attempts */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttempts.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No quiz attempts yet</p>
              <p className="text-sm text-gray-600 mt-1">Start a quiz to track your progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => (
                <div 
                  key={attempt.id} 
                  className="flex items-center justify-between border-b border-gray-800 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {new Date(attempt.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(attempt.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge 
                    variant={attempt.score >= 70 ? 'default' : 'secondary'}
                    className={
                      attempt.score >= 70 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-700'
                    }
                  >
                    {attempt.score.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      {attempts.length > 0 && (
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center border border-gray-800 rounded-lg bg-[#0a0a0a]">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
