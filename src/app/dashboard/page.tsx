"use client";

import React, { useState } from "react";

// Mock Data
const MOCK_ESCALATIONS = [
  { id: "sess_1", user: "Alice (alice@gmail.com)", topic: "UK Visa Denial", status: "PENDING", waitTime: "2m" },
  { id: "sess_2", user: "Guest User", topic: "Financial Aid Negotiation", status: "PENDING", waitTime: "5m" },
  { id: "sess_3", user: "Bob (bob@gmail.com)", topic: "IELTS waiver", status: "ACTIVE", waitTime: "0m", counselor: "You" }
];

export default function DashboardPage() {
  const [escalations, setEscalations] = useState(MOCK_ESCALATIONS);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  if (selectedSession) {
    // Render the Human Takeover Chat Interface
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#121212]">
        <header className="p-4 border-b border-[#EDEDED] dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A]">
          <div>
            <h1 className="font-bold">Session: {selectedSession}</h1>
            <p className="text-xs text-green-600 font-semibold">You have taken over this chat</p>
          </div>
          <button 
            onClick={() => setSelectedSession(null)}
            className="px-4 py-2 bg-black/10 dark:bg-white/10 rounded-lg text-sm font-medium hover:bg-black/20"
          >
            Leave Chat
          </button>
        </header>
        
        {/* Mock Chat Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-[#F7F7F7] dark:bg-[#1A1A1A] p-3 rounded-lg max-w-[80%]">
            <span className="text-xs font-bold text-gray-500 mb-1 block">AI</span>
            I do not have adequate data for this request. Would you like me to connect you to a human counselor?
          </div>
          <div className="bg-[#066AC9] text-white p-3 rounded-lg max-w-[80%] self-end ml-auto">
            <span className="text-xs font-bold text-blue-200 mb-1 block">User</span>
            Yes please, I need help with my UK visa denial appeal.
          </div>
          <div className="text-center text-xs text-gray-400 py-2">
            -- Counselor Joined --
          </div>
        </div>

        {/* Counselor Input Box */}
        <div className="p-4 border-t border-[#EDEDED] dark:border-gray-800 bg-white dark:bg-[#121212]">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type your message as a counselor..." 
              className="flex-1 px-4 py-2 border border-[#B3B3B3] rounded-lg focus:outline-none focus:border-[#066AC9] dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white"
            />
            <button className="px-6 py-2 bg-[#066AC9] text-white rounded-lg font-medium hover:bg-[#055AAB]">
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the Queue Table
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white">Active Escalations</h1>
        <p className="text-[#989898]">Monitor students who have requested human assistance.</p>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#EDEDED] dark:border-gray-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] dark:bg-[#2C2C2C] text-[#1F2022] dark:text-gray-300">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Topic</th>
              <th className="px-6 py-4 font-semibold">Wait Time</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDEDED] dark:divide-gray-800">
            {escalations.map(esc => (
              <tr key={esc.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium dark:text-white">{esc.user}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{esc.topic}</td>
                <td className="px-6 py-4 text-red-500 font-medium">{esc.waitTime}</td>
                <td className="px-6 py-4">
                  {esc.status === "PENDING" ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Waiting</span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">In Progress ({esc.counselor})</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedSession(esc.id)}
                    className="text-[#066AC9] font-semibold hover:underline"
                  >
                    {esc.status === "PENDING" ? "Takeover" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
