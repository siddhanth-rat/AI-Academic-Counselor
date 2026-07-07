"use client";

import React, { useState, useEffect, useRef } from "react";

export default function DocumentsPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Admissions");
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; text: string; category: string }>>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/v1/admin/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error("Failed to load documents", e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !text.trim()) {
      setMessage({ type: "error", text: "Please either select a document file to attach or paste text content." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      let res: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title || selectedFile.name);
        formData.append("category", category);
        formData.append("text", text);

        res = await fetch("/api/v1/admin/documents", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/v1/admin/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, category, text }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setMessage({ type: "success", text: `✨ ${data.message || "Document successfully embedded and indexed for student RAG search!"}` });
      setTitle("");
      setText("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to process document attachment" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white">RAG Knowledge Base Manager</h1>
        <p className="text-[#989898]">Attach document files or paste university policies to automatically index them into AI Counselor vectors.</p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-xl border border-[#EDEDED] dark:border-gray-800 shadow-sm mb-10">
        <h2 className="text-lg font-semibold text-[#1F2022] dark:text-white mb-4">Upload Document & Index Vectors</h2>
        
        {message && (
          <div className={`p-4 rounded-lg mb-4 text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Oxford Entry Requirements 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#121212] dark:text-white focus:outline-none focus:border-[#066AC9]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#121212] dark:text-white focus:outline-none focus:border-[#066AC9]"
              >
                <option value="Admissions">Admissions</option>
                <option value="Visa & Immigration">Visa & Immigration</option>
                <option value="Tuition & Scholarships">Tuition & Scholarships</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* File Attachment Box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attach Document File (.txt, .pdf, .md, .doc)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center bg-gray-50 dark:bg-[#121212] hover:bg-gray-100 dark:hover:bg-[#181818] transition-colors cursor-pointer relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.md,.doc,.docx,.csv,.json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#066AC9] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-[#066AC9]">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB — Ready to embed</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to attach file or drag & drop</p>
                    <p className="text-xs text-gray-500 mt-1">Supports TXT, PDF, Markdown, Word, and CSV files</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Or Paste Raw Text / Additional Notes</label>
            <textarea
              rows={4}
              placeholder="Optional additional notes or direct policy text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#121212] dark:text-white focus:outline-none focus:border-[#066AC9]"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || (!selectedFile && !text.trim())}
            className="w-full md:w-auto px-8 py-3 bg-[#066AC9] text-white font-medium rounded-lg hover:bg-[#055AAB] disabled:opacity-50 transition-colors shadow-sm"
          >
            {isUploading ? "Uploading & Generating Embeddings..." : "Upload & Index for Student RAG"}
          </button>
        </form>
      </div>

      {/* Indexed Documents Table */}
      <div>
        <h2 className="text-xl font-bold text-[#1F2022] dark:text-white mb-4">Live Knowledge Base Index ({documents.length} vector chunks)</h2>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#EDEDED] dark:border-gray-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F7F7] dark:bg-[#2C2C2C] text-[#1F2022] dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Indexed Snippet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED] dark:divide-gray-800">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No documents indexed yet. Attach your first file above!
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium dark:text-white">{doc.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-semibold rounded-md">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-md truncate">
                      {doc.text}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
