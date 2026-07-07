"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface StatItem {
  id?: string;
  date: string | Date;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost: any;
  message_count: number;
}

const MOCK_STATS: StatItem[] = [
  { date: "2026-07-01", prompt_tokens: 24000, completion_tokens: 9500, estimated_cost: 0.24, message_count: 24 },
  { date: "2026-07-02", prompt_tokens: 35000, completion_tokens: 14000, estimated_cost: 0.35, message_count: 35 },
  { date: "2026-07-03", prompt_tokens: 29000, completion_tokens: 11500, estimated_cost: 0.29, message_count: 29 },
  { date: "2026-07-04", prompt_tokens: 18000, completion_tokens: 7200, estimated_cost: 0.18, message_count: 18 },
  { date: "2026-07-05", prompt_tokens: 42000, completion_tokens: 17500, estimated_cost: 0.42, message_count: 42 },
  { date: "2026-07-06", prompt_tokens: 51000, completion_tokens: 21000, estimated_cost: 0.51, message_count: 51 },
  { date: "2026-07-07", prompt_tokens: 31000, completion_tokens: 12500, estimated_cost: 0.31, message_count: 31 }
];

export default function BillingPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [dbStats, setDbStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "ADMIN") {
      const loadStats = async () => {
        try {
          const res = await fetch("/api/v1/admin/billing-stats");
          if (res.ok) {
            const data = await res.json();
            setDbStats(data.stats || []);
          }
        } catch (e) {
          console.error("Failed to load billing metrics", e);
        } finally {
          setLoading(false);
        }
      };
      loadStats();
    }
  }, [role]);

  if (role !== "ADMIN") {
    return (
      <div className="p-8 max-w-5xl mx-auto flex h-full items-center justify-center">
        <p className="text-gray-500 font-medium">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Use DB stats if available, otherwise display Mock stats as a demonstration
  const activeStats = dbStats.length > 0 ? dbStats : MOCK_STATS;
  const isMock = dbStats.length === 0;

  // Calculate totals
  const totalPromptTokens = activeStats.reduce((sum, item) => sum + item.prompt_tokens, 0);
  const totalCompletionTokens = activeStats.reduce((sum, item) => sum + item.completion_tokens, 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const totalMessages = activeStats.reduce((sum, item) => sum + item.message_count, 0);
  
  // Free tier calculations: Free API calls means active billing cost is 0.00
  const actualCost = 0.00;
  // Calculate value savings based on typical paid pricing models
  // Let's assume paid tier pricing: $0.075 per 1M input tokens + $0.30 per 1M output tokens (Gemini 2.5 Flash equivalent value)
  const estimatedPaidCost = activeStats.reduce((sum, item) => {
    const costVal = parseFloat(item.estimated_cost?.toString() || "0");
    return sum + (costVal > 0 ? costVal : (item.prompt_tokens * 0.000000075 + item.completion_tokens * 0.0000003));
  }, 0);

  // SVG Chart Dimensions
  const chartHeight = 200;
  const chartWidth = 700;
  const maxTokenVal = Math.max(...activeStats.map(item => item.prompt_tokens + item.completion_tokens), 1000);
  const maxMessageVal = Math.max(...activeStats.map(item => item.message_count), 5);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white flex items-center gap-2">
            💸 Billing & Token Analytics
            {isMock && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50 uppercase tracking-wider font-bold animate-pulse">
                Sample Demo Data
              </span>
            )}
          </h1>
          <p className="text-sm text-[#989898] mt-1">Audit operational Gemini API resource limits, token counts, and cost metrics.</p>
        </div>
      </div>

      {/* Free Tier Callout Widget */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800/20 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
        <div>
          <h3 className="text-emerald-800 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-base">
            ✨ Free Tier Subscription Active
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl leading-relaxed">
            Your chatbot is configured on Gemini's free tier. All incoming tokens and LLM request prompts are free of cost. Detailed stats demonstrate equivalent commercial value.
          </p>
        </div>
        <div className="shrink-0 text-center bg-white dark:bg-[#202020] px-6 py-4 rounded-xl border border-emerald-500/20 shadow-sm min-w-[200px]">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Free Plan Value Saved</div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">${estimatedPaidCost.toFixed(2)}</div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">Estimated Commercial Cost Saved</div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accumulated Cost</div>
          <div className="text-2xl font-extrabold text-[#1F2022] dark:text-white mt-1.5">$0.00</div>
          <div className="text-[10px] text-emerald-500 font-bold mt-1">✓ 100% Free Plan</div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Messages</div>
          <div className="text-2xl font-extrabold text-[#1F2022] dark:text-white mt-1.5">{totalMessages}</div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">Sent across chat sessions</div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Tokens used</div>
          <div className="text-2xl font-extrabold text-[#1F2022] dark:text-white mt-1.5">
            {totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">Prompt: {totalPromptTokens} | Output: {totalCompletionTokens}</div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Cost / Message</div>
          <div className="text-2xl font-extrabold text-[#1F2022] dark:text-white mt-1.5">
            ${totalMessages > 0 ? (estimatedPaidCost / totalMessages).toFixed(4) : "0.0000"}
          </div>
          <div className="text-[10px] text-amber-500 font-bold mt-1">Paid Tier Estimate</div>
        </div>
      </div>

      {/* SVG Charts Panel */}
      <div className="space-y-6">
        {/* Token consumption chart */}
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-bold text-[#1F2022] dark:text-white mb-6 uppercase tracking-wider text-gray-400">Daily Token Consumption</h3>
          
          <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full h-auto min-w-[600px] overflow-visible">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((level, i) => {
                const y = chartHeight * (1 - level);
                const val = Math.round(maxTokenVal * level);
                return (
                  <g key={i}>
                    <line x1="50" y1={y} x2={chartWidth - 20} y2={y} className="stroke-gray-100 dark:stroke-gray-800/50 stroke-1" strokeDasharray="4 4" />
                    <text x="10" y={y + 4} className="fill-gray-400 text-[10px] font-semibold text-right">{val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}</text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {activeStats.map((item, idx) => {
                const x = 70 + (idx * ((chartWidth - 100) / activeStats.length));
                const totalDaily = item.prompt_tokens + item.completion_tokens;
                
                const promptHeight = (item.prompt_tokens / maxTokenVal) * chartHeight;
                const completionHeight = (item.completion_tokens / maxTokenVal) * chartHeight;
                
                const promptY = chartHeight - promptHeight;
                const completionY = promptY - completionHeight;

                const dateText = new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

                return (
                  <g key={idx} className="group">
                    {/* Completion tokens bar (Top) */}
                    <rect 
                      x={x} 
                      y={completionY} 
                      width="32" 
                      height={completionHeight} 
                      className="fill-indigo-500 dark:fill-indigo-600 transition-all hover:opacity-90 cursor-pointer" 
                    />
                    {/* Prompt tokens bar (Bottom) */}
                    <rect 
                      x={x} 
                      y={promptY} 
                      width="32" 
                      height={promptHeight} 
                      className="fill-blue-500 dark:fill-blue-600 transition-all hover:opacity-90 cursor-pointer" 
                    />
                    
                    {/* Date label */}
                    <text x={x + 16} y={chartHeight + 20} textAnchor="middle" className="fill-gray-400 text-[9px] font-bold uppercase tracking-wide">
                      {dateText}
                    </text>
                    
                    {/* Tooltip on Hover */}
                    <title>{`Date: ${dateText}\nPrompt: ${item.prompt_tokens} tokens\nOutput: ${item.completion_tokens} tokens\nTotal: ${totalDaily} tokens`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
          
          <div className="flex gap-4 mt-4 justify-center text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-gray-500"><span className="h-3 w-3 bg-blue-500 rounded-sm"></span> Input (Prompts)</span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-500"><span className="h-3 w-3 bg-indigo-500 rounded-sm"></span> Output (Gemini Responses)</span>
          </div>
        </div>

        {/* Message volume count chart */}
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-bold text-[#1F2022] dark:text-white mb-6 uppercase tracking-wider text-gray-400">Daily Message Volume</h3>
          
          <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full h-auto min-w-[600px] overflow-visible">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((level, i) => {
                const y = chartHeight * (1 - level);
                const val = Math.round(maxMessageVal * level);
                return (
                  <g key={i}>
                    <line x1="50" y1={y} x2={chartWidth - 20} y2={y} className="stroke-gray-100 dark:stroke-gray-800/50 stroke-1" strokeDasharray="4 4" />
                    <text x="10" y={y + 4} className="fill-gray-400 text-[10px] font-semibold text-right">{val}</text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {activeStats.map((item, idx) => {
                const x = 70 + (idx * ((chartWidth - 100) / activeStats.length));
                const barHeight = (item.message_count / maxMessageVal) * chartHeight;
                const barY = chartHeight - barHeight;
                
                const dateText = new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

                return (
                  <g key={idx}>
                    <rect 
                      x={x + 4} 
                      y={barY} 
                      width="24" 
                      height={barHeight} 
                      className="fill-emerald-400 dark:fill-emerald-500 hover:fill-emerald-500 dark:hover:fill-emerald-600 transition-colors duration-200 cursor-pointer rounded-lg" 
                    />
                    
                    {/* Date label */}
                    <text x={x + 16} y={chartHeight + 20} textAnchor="middle" className="fill-gray-400 text-[9px] font-bold uppercase tracking-wide">
                      {dateText}
                    </text>
                    
                    <title>{`Date: ${dateText}\nMessages: ${item.message_count}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
