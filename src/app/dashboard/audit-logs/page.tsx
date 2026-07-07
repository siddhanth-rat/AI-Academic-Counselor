"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Actor {
  name: string | null;
  email: string | null;
  role: string;
}

interface AuditLog {
  id: string;
  actor_id: string;
  action_type: string;
  target_entity: string | null;
  ip_address: string;
  created_at: string;
  actor: Actor;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/audit-logs?page=${currentPage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN") {
      fetchLogs(page);
    }
  }, [role, page]);

  if (role !== "ADMIN") {
    return (
      <div className="p-8 max-w-5xl mx-auto flex h-full items-center justify-center">
        <p className="text-gray-500 font-medium">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white">System Compliance Logs</h1>
          <p className="text-sm text-[#989898] mt-1">Audit log tracking administrative updates, RAG knowledge modifications, and chat escalations.</p>
        </div>
        <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          Total Logs: {total}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#EDEDED] dark:border-gray-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] dark:bg-[#2C2C2C] text-[#1F2022] dark:text-gray-300">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Timestamp</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Actor</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Action Type</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Target Entity</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDEDED] dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-medium animate-pulse">
                  Loading compliance logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                  No system audit records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#1F2022] dark:text-white">
                      {log.actor?.name || log.actor?.email}
                    </span>
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-blue-100 text-blue-800 uppercase tracking-wider dark:bg-blue-900/30 dark:text-blue-300">
                      {log.actor?.role}
                    </span>
                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">{log.actor?.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-xs font-mono">
                    <span className="px-2.5 py-1.5 rounded-lg bg-gray-105 dark:bg-gray-800 text-gray-800 dark:text-gray-200 uppercase">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 max-w-[200px] truncate" title={log.target_entity || ""}>
                    {log.target_entity || <span className="text-gray-400 font-normal italic">—</span>}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                    {log.ip_address}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#EDEDED] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/10">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
