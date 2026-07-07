"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Counselor {
  name: string | null;
  email: string | null;
}

interface Performance {
  counselor_id: string;
  total_handled: number;
  avg_response_sec: number;
  satisfaction_score: number | null;
  counselor: Counselor;
}

export default function PerformancesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "ADMIN") {
      const fetchPerformances = async () => {
        try {
          const res = await fetch("/api/v1/counselor/performances");
          if (res.ok) {
            const data = await res.json();
            setPerformances(data.performances || []);
          }
        } catch (e) {
          console.error("Failed to fetch performances", e);
        } finally {
          setLoading(false);
        }
      };
      fetchPerformances();
    }
  }, [role]);

  if (role !== "ADMIN") {
    return (
      <div className="p-8 max-w-5xl mx-auto flex h-full items-center justify-center">
        <p className="text-gray-500 font-medium">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Calculate Team-Wide Aggregated Performance Metrics
  const validScores = performances
    .map(p => p.satisfaction_score ? parseFloat(p.satisfaction_score.toString()) : null)
    .filter((s): s is number => s !== null);
    
  const teamAverageSatisfaction = validScores.length > 0
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    : 0.0;

  const totalHandled = performances.reduce((sum, p) => sum + p.total_handled, 0);
  
  const avgResponseTime = performances.length > 0
    ? performances.reduce((sum, p) => sum + p.avg_response_sec, 0) / performances.length
    : 0.0;

  // Chart values
  const maxResponseTime = Math.max(...performances.map(p => p.avg_response_sec), 30);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white">Counselor Performance Analytics</h1>
        <p className="text-sm text-[#989898] mt-1">Monitor operational metrics and average response times. Counselor identities are anonymized to maintain a supportive, non-toxic environment.</p>
      </div>

      {/* Team Aggregated KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Team Rating</div>
          <div className="text-3xl font-extrabold text-[#1F2022] dark:text-white mt-1.5 flex items-center gap-1.5">
            {teamAverageSatisfaction > 0 ? teamAverageSatisfaction.toFixed(1) : "—"}
            {teamAverageSatisfaction > 0 && (
              <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">Based on student ratings</div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Handled Sessions</div>
          <div className="text-3xl font-extrabold text-[#1F2022] dark:text-white mt-1.5">
            {totalHandled}
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">Counselor claimed cases</div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average response speed</div>
          <div className="text-3xl font-extrabold text-[#1F2022] dark:text-white mt-1.5">
            {avgResponseTime > 0 ? `${avgResponseTime.toFixed(0)}s` : "—"}
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">Time elapsed before taking over</div>
        </div>
      </div>

      {/* Visual Anonymized Response Times Chart */}
      {!loading && performances.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm mb-8">
          <h3 className="text-sm font-bold text-[#1F2022] dark:text-white mb-6 uppercase tracking-wider text-gray-400">Response Speed Comparison (Anonymized)</h3>
          <div className="space-y-4">
            {performances.map((perf, idx) => {
              const widthPct = Math.max(10, Math.min(100, (perf.avg_response_sec / maxResponseTime) * 100));
              return (
                <div key={perf.counselor_id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <span>Staff Member {idx + 1}</span>
                    <span>{perf.avg_response_sec}s</span>
                  </div>
                  <div className="h-4.5 w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div 
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-lg ${
                        perf.avg_response_sec < 30 ? "bg-emerald-400 dark:bg-emerald-500" :
                        perf.avg_response_sec < 60 ? "bg-blue-400 dark:bg-blue-500" :
                        "bg-amber-400 dark:bg-amber-500"
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Counselor Performances Table */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#EDEDED] dark:border-gray-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] dark:bg-[#2C2C2C] text-[#1F2022] dark:text-gray-300">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Counselor Identifier</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Total Handled</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Avg Response Time</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Satisfaction Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDEDED] dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                  Loading performances...
                </td>
              </tr>
            ) : performances.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                  No performance data available yet.
                </td>
              </tr>
            ) : (
              performances.map((perf, idx) => (
                <tr key={perf.counselor_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#1F2022] dark:text-white">
                    Staff Member {idx + 1}
                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">Encrypted ID: {perf.counselor_id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                    {perf.total_handled} session{perf.total_handled !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                    {perf.avg_response_sec}s
                  </td>
                  <td className="px-6 py-4">
                    {perf.satisfaction_score ? (
                      <div className="flex items-center gap-1.5 font-bold text-yellow-500">
                        {parseFloat(perf.satisfaction_score.toString()).toFixed(1)}
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Unrated</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
