"use client";

import { useState } from "react";
import { useChat } from "@/context/ChatContext";

export default function CounselorRating({ sessionId }: { sessionId: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { updateSessionStatus } = useChat();

  const submitRating = async (score: number) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/chat/counselor-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating: score })
      });
      if (res.ok) {
        // Update local session status to ACTIVE to unblock UI
        updateSessionStatus(sessionId, "ACTIVE");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm border border-blue-100 dark:from-blue-900/20 dark:to-[#1A1A1A] dark:border-blue-900/30">
      <h3 className="text-lg font-bold text-[#1F2022] dark:text-white mb-2">How was your counselor?</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
        Your conversation with the human counselor has ended. Please rate your experience before continuing your AI chat.
      </p>
      
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={submitting}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => {
              setRating(star);
              submitRating(star);
            }}
            className="focus:outline-none transition-transform hover:scale-110 disabled:opacity-50"
          >
            <svg 
              className={`w-10 h-10 ${star <= (hovered || rating) ? "text-yellow-400 drop-shadow-sm" : "text-gray-200 dark:text-gray-700"} transition-colors duration-200`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {submitting && <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">Saving rating...</p>}
    </div>
  );
}
