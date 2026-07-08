"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export type ConversationMessageData = {
  id?: string;
  role: "user" | "model" | "counselor" | "system";
  content: string;
  isLoading?: boolean;
  senderName?: string;
};

type Props = {
  message: ConversationMessageData;
  viewer: "student" | "counselor";
  studentName?: string;
  counselorName?: string;
  onSendMessage?: (text: string) => void;
};

export default function ConversationMessage({ message, viewer, studentName, counselorName, onSendMessage }: Props) {
  const [feedbackState, setFeedbackState] = useState<"idle" | "downvoted" | "submitted">("idle");
  const [feedbackReason, setFeedbackReason] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customResponse, setCustomResponse] = useState("");
  const [activeCitation, setActiveCitation] = useState<{ title: string; text: string } | null>(null);
  const [isLoadingCitation, setIsLoadingCitation] = useState(false);

  const handleCitationClick = async (citationId: string) => {
    setIsLoadingCitation(true);
    try {
      const res = await fetch(`/api/v1/chats/citations/${citationId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCitation({ title: data.title, text: data.text });
      } else {
        alert("Could not load citation content.");
      }
    } catch (e) {
      console.error("Citation load error:", e);
    } finally {
      setIsLoadingCitation(false);
    }
  };

  const submitFeedback = async (score: number, reason: string = "") => {
    if (!message.id) return;
    try {
      await fetch("/api/v1/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, rating: score, feedbackReason: reason }),
      });
      setFeedbackState("submitted");
      setRating(score);
    } catch (e) {
      console.error("Failed to submit feedback", e);
    }
  };

  const handleThumbsUp = () => {
    if (feedbackState !== "idle") return;
    submitFeedback(5);
  };

  const handleThumbsDown = () => {
    if (feedbackState !== "idle") return;
    setFeedbackState("downvoted");
  };

  if (message.role === "system") {
    return (
      <div className="flex w-full items-center gap-3 py-2" role="status">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-400/70 dark:to-gray-600/70" />
        <p className="max-w-[78%] text-center font-mono text-[11px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-gray-600 dark:text-gray-400">
          {message.content}
        </p>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-400/70 dark:to-gray-600/70" />
      </div>
    );
  }

  const isStudent = message.role === "user";
  const isCounselor = message.role === "counselor";
  const isOwn = (viewer === "student" && isStudent) || (viewer === "counselor" && isCounselor);
  const displayName = isStudent
    ? message.senderName || studentName || "Student"
    : isCounselor
      ? message.senderName || counselorName || "Counselor"
      : "AI Counselor";
  const initial = message.role === "model" ? "AI" : displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className={`flex w-full gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        <div className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#066AC9] to-[#0A84FF] text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#121212]">
          {initial}
        </div>
        <div className={`flex max-w-[82%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
          <span className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {displayName}
          </span>
          <div className={`text-sm md:text-base ${isStudent
            ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#066AC9] to-[#0A84FF] px-4 py-3 text-white shadow-sm"
            : isCounselor
              ? "rounded-2xl rounded-tl-sm border border-[#066AC9]/20 bg-[#066AC9]/5 px-4 py-3 text-[#1F2022] shadow-sm dark:bg-[#066AC9]/10 dark:text-gray-100"
              : "max-w-none bg-transparent py-1 text-[#1F2022] dark:text-[#E0E0E0]"
            }`}>
            {message.isLoading ? (
              <div className="flex h-6 items-center space-x-1.5">
                {[0, 150, 300].map((delay) => <span key={delay} className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#066AC9]" style={{ animationDelay: `${delay}ms` }} />)}
              </div>
            ) : message.role === "model" ? (
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  urlTransform={(url) => url}
                  components={{
                    a({ href, children, ...props }) {
                      if (href && href.startsWith("citation:")) {
                        const citationId = href.replace("citation:", "");
                        return (
                          <button
                            onClick={() => handleCitationClick(citationId)}
                            className="not-prose inline-flex items-center gap-1 px-2 py-0.5 mx-1 my-0.5 text-xs font-bold text-[#066AC9] dark:text-[#0A84FF] bg-[#066AC9]/10 hover:bg-[#066AC9]/20 rounded-md border border-[#066AC9]/20 transition-all cursor-pointer select-none align-middle"
                            title="Click to view official source document details"
                          >
                            📄 {children || "View Source"}
                          </button>
                        );
                      }
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                          {children}
                        </a>
                      );
                    },
                    pre({ children }) {
                      const isCustomBlock = React.Children.toArray(children).some((child: any) => {
                        const className = child?.props?.className || "";
                        return /language-(checklist|recommendations|questionnaire)/.test(className);
                      });

                      if (isCustomBlock) {
                        return <>{children}</>;
                      }

                      return <pre className="bg-gray-800 rounded-xl p-4 overflow-x-auto">{children}</pre>;
                    },
                    code({ node, className, children, ...props }) {
                      const match = /language-questionnaire/.exec(className || "");
                      if (match) {
                        try {
                          const data = JSON.parse(String(children).trim());
                          return (
                            <div className="not-prose my-4 p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm space-y-4 max-w-md">
                              <p className="text-sm font-bold text-[#1F2022] dark:text-gray-100 leading-snug">
                                {data.question}
                              </p>
                              <div className="flex flex-col gap-2">
                                {data.options?.map((opt: string, idx: number) => {
                                  const isSelected = selectedOption === opt;
                                  const isAnySelected = selectedOption !== null;
                                  return (
                                    <button
                                      key={idx}
                                      disabled={!onSendMessage || isAnySelected}
                                      onClick={() => {
                                        if (onSendMessage) {
                                          setSelectedOption(opt);
                                          onSendMessage(opt);
                                        }
                                      }}
                                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                        ? "border-[#066AC9] bg-[#066AC9] text-white dark:border-[#0A84FF] dark:bg-[#0A84FF]"
                                        : isAnySelected
                                          ? "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-transparent dark:text-gray-600 opacity-60"
                                          : "border-black/5 bg-white hover:border-[#066AC9]/50 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}

                                {/* Option 5: Custom Message Input */}
                                {selectedOption && selectedOption.startsWith("Other: ") ? (
                                  <div className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#066AC9] bg-[#066AC9] text-white dark:border-[#0A84FF] dark:bg-[#0A84FF]">
                                    Selected: "{selectedOption.replace("Other: ", "")}"
                                  </div>
                                ) : showCustomInput ? (
                                  <div className="flex w-full items-center gap-2 rounded-xl border border-[#066AC9]/30 bg-[#066AC9]/5 p-2 dark:bg-[#0A84FF]/5 dark:border-[#0A84FF]/30 mt-1">
                                    <input
                                      type="text"
                                      value={customResponse}
                                      onChange={e => setCustomResponse(e.target.value)}
                                      placeholder="Type your custom response here..."
                                      className="flex-1 bg-transparent px-2 py-1 text-xs outline-none text-[#1F2022] dark:text-white"
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === "Enter" && customResponse.trim() && onSendMessage) {
                                          setSelectedOption(`Other: ${customResponse}`);
                                          onSendMessage(customResponse);
                                        }
                                      }}
                                    />
                                    <button
                                      disabled={!customResponse.trim()}
                                      onClick={() => {
                                        if (onSendMessage) {
                                          setSelectedOption(`Other: ${customResponse}`);
                                          onSendMessage(customResponse);
                                        }
                                      }}
                                      className="rounded-lg bg-[#066AC9] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#055AAB] disabled:opacity-50 transition-colors"
                                    >
                                      Send
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    disabled={!onSendMessage || selectedOption !== null}
                                    onClick={() => {
                                      setShowCustomInput(true);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold border border-dashed transition-all cursor-pointer ${selectedOption !== null
                                      ? "border-gray-200 text-gray-400 opacity-60 dark:border-gray-800"
                                      : "border-gray-300 bg-transparent hover:border-[#066AC9] hover:text-[#066AC9] dark:border-gray-700 dark:hover:border-[#0A84FF] dark:hover:text-[#0A84FF] text-gray-500 dark:text-gray-400"
                                      }`}
                                  >
                                    ✏️ Other / Write custom response...
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="not-prose my-3 p-4 rounded-2xl border border-dashed border-[#066AC9]/30 bg-[#066AC9]/5 animate-pulse text-xs font-semibold text-[#066AC9] dark:text-[#0A84FF] flex items-center gap-2">
                              <span>💬 Preparing options...</span>
                            </div>
                          );
                        }
                      }

                      const isRecs = /language-recommendations/.exec(className || "");
                      if (isRecs) {
                        try {
                          const data = JSON.parse(String(children).trim());
                          const recList = data.recommendations || [];
                          return (
                            <div className="not-prose my-4 w-full overflow-x-auto pb-4 custom-scrollbar">
                              <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                                {recList.map((rec: any, idx: number) => {
                                  const isSafe = rec.match_category === "Safe";
                                  const isReach = rec.match_category === "Reach";
                                  const categoryColor = isSafe
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : isReach
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:amber-400"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
                                  return (
                                    <div key={idx} className="w-[300px] rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-md p-5 shadow-sm space-y-4 hover:shadow-md hover:border-[#066AC9]/30 transition-all duration-300">
                                      <div>
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryColor}`}>
                                          {rec.match_category} Match
                                        </span>
                                        <h4 className="text-sm font-bold text-[#1F2022] dark:text-gray-100 mt-2 truncate">
                                          {rec.program_name}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
                                          {rec.university_name}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                          📍 {rec.city ? `${rec.city}, ` : ""}{rec.country}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 border-t border-black/5 dark:border-white/5 pt-3 text-[11px]">
                                        <div>
                                          <span className="text-gray-400 block font-medium">Annual Tuition</span>
                                          <span className="font-bold text-gray-700 dark:text-gray-300">
                                            {rec.tuition_fee === 0 ? "Free" : `$${rec.tuition_fee.toLocaleString()}/yr`}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block font-medium">QS Rank</span>
                                          <span className="font-bold text-gray-700 dark:text-gray-300">#{rec.qs_rank || "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block font-medium">Min GPA</span>
                                          <span className="font-bold text-gray-700 dark:text-gray-300">{rec.min_gpa || "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block font-medium">IELTS Req</span>
                                          <span className="font-bold text-gray-700 dark:text-gray-300">{rec.ielts_requirement || "N/A"}</span>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={async () => {
                                            try {
                                              const response = await fetch("/api/v1/recommendations/shortlist", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ programId: rec.id })
                                              });
                                              if (response.ok) {
                                                alert("Successfully shortlisted!");
                                              }
                                            } catch (err) {
                                              console.error("Shortlisting failed", err);
                                            }
                                          }}
                                          className="flex-1 text-center py-2 rounded-xl text-[10px] font-bold bg-[#066AC9] text-white hover:bg-[#055AAB] transition-colors cursor-pointer"
                                        >
                                          Shortlist
                                        </button>
                                        {rec.website && (
                                          <a
                                            href={rec.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 rounded-xl border border-black/5 dark:border-white/10 text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-500 dark:text-gray-300"
                                          >
                                            🔗
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="not-prose my-3 p-4 rounded-2xl border border-dashed border-[#066AC9]/30 bg-[#066AC9]/5 animate-pulse text-xs font-semibold text-[#066AC9] dark:text-[#0A84FF] flex items-center gap-2">
                              <span>🎓 Formulating university recommendations...</span>
                            </div>
                          );
                        }
                      }

                      const isChecklist = /language-checklist/.exec(className || "");
                      if (isChecklist) {
                        try {
                          const data = JSON.parse(String(children).trim());
                          const profile = data.profile || {};
                          const nextSteps = data.next_steps || [];
                          const sName = studentName || "Student";
                          const possessiveName = sName.endsWith("s") ? `${sName}' Path` : `${sName}'s Path`;

                          return (
                            <div className="not-prose my-4 p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm w-full transition-all duration-300">
                              <div className="text-sm font-extrabold text-[#066AC9] dark:text-[#0A84FF] mb-3 uppercase tracking-wider">
                                {possessiveName}
                              </div>
                              <div className="pt-4 border-t border-gray-100 dark:border-white/[0.05] space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800/80">
                                  <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Current Status
                                  </h3>
                                  <span className="px-2 py-0.5 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-[9px] font-bold uppercase rounded-full tracking-wider">
                                    Active
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                                  <div className="space-y-2 text-xs">
                                    <h4 className="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800/60 pb-1.5 mb-2.5">
                                      Profile Parameters
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between py-0.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">GPA:</span>
                                        <span className="font-bold text-[#1F2022] dark:text-gray-200">{profile.gpa || "Not Specified"}</span>
                                      </div>
                                      <div className="flex justify-between py-0.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">IELTS/TOEFL:</span>
                                        <span className="font-bold text-[#1F2022] dark:text-gray-200">{profile.ielts || "Not Taken"}</span>
                                      </div>
                                      <div className="flex justify-between py-0.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Destination:</span>
                                        <span className="font-bold text-[#1F2022] dark:text-gray-200">{profile.target_country || "Not Specified"}</span>
                                      </div>
                                      <div className="flex justify-between py-0.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Course:</span>
                                        <span className="font-bold text-[#1F2022] dark:text-gray-200 truncate max-w-[110px]" title={profile.course}>
                                          {profile.course || "Not Specified"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="border-b border-gray-100 dark:border-gray-800/60 pb-1.5 mb-2.5">
                                      <h4 className="font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        Your Next Steps
                                      </h4>
                                    </div>
                                    <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1.5 always-scrollbar">
                                      {nextSteps.map((step: any, idx: number) => {
                                        return (
                                          <label
                                            key={idx}
                                            className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={step.completed}
                                              onChange={async (e) => {
                                                const dbField = step.db_field || "";
                                                if (dbField && onSendMessage) {
                                                  try {
                                                    await fetch("/api/v1/user/profile", {
                                                      method: "PATCH",
                                                      headers: { "Content-Type": "application/json" },
                                                      body: JSON.stringify({
                                                        [dbField]: e.target.checked
                                                      })
                                                    });
                                                    onSendMessage(`I have updated my status: Checked off '${step.label}'`);
                                                  } catch (err) {
                                                    console.error("Failed to update checkbox status in DB", err);
                                                  }
                                                }
                                              }}
                                              className="mt-0.5 rounded border-gray-300 text-[#066AC9] focus:ring-[#066AC9] dark:border-gray-700"
                                            />
                                            <span className={step.completed ? "line-through text-gray-400 dark:text-gray-650" : ""}>
                                              {step.label}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="not-prose my-3 p-4 rounded-2xl border border-dashed border-[#066AC9]/30 bg-[#066AC9]/5 animate-pulse text-xs font-semibold text-[#066AC9] dark:text-[#0A84FF] flex items-center gap-2">
                              <span>📊 Updating admissions roadmap...</span>
                            </div>
                          );
                        }
                      }

                      return <code className={className}>{children}</code>;
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* Feedback UI for AI messages */}
          {message.role === "model" && !message.isLoading && message.id && viewer === "student" && (
            <div className="mt-1 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 text-gray-400">
                <button
                  onClick={handleThumbsUp}
                  disabled={feedbackState !== "idle"}
                  className={`flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 hover:text-green-600 dark:hover:bg-[#2A2A2A] transition-colors ${rating === 5 ? "text-green-600" : ""}`}
                  title="Good response"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                </button>
                <button
                  onClick={handleThumbsDown}
                  disabled={feedbackState !== "idle"}
                  className={`flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 hover:text-red-600 dark:hover:bg-[#2A2A2A] transition-colors ${rating === 1 || feedbackState === "downvoted" ? "text-red-600" : ""}`}
                  title="Bad response"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" /></svg>
                </button>
                {feedbackState === "submitted" && <span className="text-[10px] text-gray-400">Thanks for the feedback!</span>}
              </div>

              {feedbackState === "downvoted" && (
                <div className="flex w-full items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800">
                  <input
                    type="text"
                    value={feedbackReason}
                    onChange={e => setFeedbackReason(e.target.value)}
                    placeholder="What went wrong?"
                    className="flex-1 bg-transparent px-2 py-1 text-xs outline-none dark:text-white"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") submitFeedback(1, feedbackReason); }}
                  />
                  <button
                    onClick={() => submitFeedback(1, feedbackReason)}
                    className="rounded bg-[#066AC9] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#055AAB]"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeCitation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl max-w-2xl w-full border border-[#EDEDED] dark:border-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <header className="p-4 border-b border-[#EDEDED] dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1C1C1E]">
              <h3 className="font-bold text-sm text-[#1F2022] dark:text-white flex items-center gap-2">
                📖 Citation Source: {activeCitation.title}
              </h3>
              <button 
                onClick={() => setActiveCitation(null)}
                className="h-7 w-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-all font-bold cursor-pointer text-[#1F2022] dark:text-white"
              >
                ✕
              </button>
            </header>
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {activeCitation.text}
            </div>
            <footer className="p-4 border-t border-[#EDEDED] dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1E] flex justify-end">
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-2 bg-[#066AC9] hover:bg-[#055AAB] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
