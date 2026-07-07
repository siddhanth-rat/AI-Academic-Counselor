"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

interface QueryResult {
  id: string;
  similarity: number;
  text: string;
  title: string;
  category: string;
  country: string | null;
}

export default function RAGPlaygroundPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setSearched(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/admin/rag-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error status: ${res.status}`);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to search vector store.");
    } finally {
      setSearching(false);
    }
  };

  if (role !== "ADMIN") {
    return (
      <div className="p-8 max-w-5xl mx-auto flex h-full items-center justify-center">
        <p className="text-gray-500 font-medium">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white">RAG Query Playground</h1>
        <p className="text-sm text-[#989898] mt-1">Debug semantic search matching. Enter search terms to check which vector database chunks score highest.</p>
      </div>

      {/* Query input form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter query (e.g. 'UK student visa financial limits' or 'NUS GPA cutoff')"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:border-[#066AC9] text-sm shadow-sm"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="px-6 py-3 bg-[#066AC9] hover:bg-[#055AAB] disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md cursor-pointer text-sm shrink-0"
          >
            {searching ? "Searching..." : "Test Query"}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center font-semibold dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Query Results */}
      <div className="space-y-4">
        {searching ? (
          <div className="text-center text-gray-500 font-medium py-12 animate-pulse">
            Generating query embeddings and searching pgvector store...
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center text-gray-500 font-medium py-12 bg-white dark:bg-[#1A1A1A] border border-[#EDEDED] dark:border-gray-800 rounded-xl">
            📭 No matching vector chunks found. Verify that the RAG data has been seeded.
          </div>
        ) : (
          results.map((item, idx) => {
            const pct = Math.round(item.similarity * 1000) / 10;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1A1A1A] p-5 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm hover:border-[#066AC9]/30 transition-all duration-200 group"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-[#066AC9] dark:text-[#0A84FF] uppercase tracking-wider">
                      {item.category} {item.country ? `• ${item.country}` : ""}
                    </span>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-white mt-0.5">{item.title}</h3>
                  </div>
                  
                  {/* Similarity Badge */}
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                    pct >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" :
                    pct >= 60 ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {pct.toFixed(1)}% Match
                  </span>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium bg-gray-50 dark:bg-[#2C2C2C]/10 p-3 rounded-lg border border-gray-100/50 dark:border-gray-850">
                  {item.text}
                </div>
                <div className="text-[9px] font-mono text-gray-400 dark:text-gray-500 mt-2 text-right">
                  Chunk Chunk ID: {item.id}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
