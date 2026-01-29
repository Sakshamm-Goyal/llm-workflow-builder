'use client';

import { useState, useEffect } from 'react';
import {
    History,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    Loader2
} from 'lucide-react';

interface NodeResultDisplay {
    id: string;
    nodeId: string;
    nodeType: string;
    status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING';
    duration?: number;
    output?: unknown;
    error?: string;
}

interface WorkflowRunDisplay {
    id: string;
    status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PARTIAL';
    scope: 'FULL' | 'PARTIAL' | 'SINGLE';
    startedAt: Date;
    duration?: number;
    nodeResults: NodeResultDisplay[];
}

interface HistorySidebarProps {
    workflowId?: string;
}

export function HistorySidebar({ workflowId }: HistorySidebarProps) {
    const [runs, setRuns] = useState<WorkflowRunDisplay[]>([]);
    const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Fetch runs when workflowId changes
    useEffect(() => {
        if (!workflowId) {
            setRuns([]);
            return;
        }

        const fetchRuns = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/workflows/${workflowId}/runs`);
                if (response.ok) {
                    const data = await response.json();
                    setRuns(data.runs || []);
                }
            } catch (error) {
                console.error('Failed to fetch runs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRuns();
    }, [workflowId]);

    const toggleRun = (runId: string) => {
        setExpandedRuns(prev => {
            const next = new Set(prev);
            if (next.has(runId)) {
                next.delete(runId);
            } else {
                next.add(runId);
            }
            return next;
        });
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const getScopeLabel = (scope: string, nodeCount?: number) => {
        switch (scope) {
            case 'FULL':
                return 'Full Workflow';
            case 'SINGLE':
                return 'Single Node';
            case 'PARTIAL':
                return `${nodeCount || 0} nodes`;
            default:
                return scope;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Success
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
            case 'RUNNING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Running
                    </span>
                );
            case 'PARTIAL':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                        <Clock className="w-3 h-3" />
                        Partial
                    </span>
                );
            default:
                return null;
        }
    };

    const getNodeStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'FAILED':
                return <XCircle className="w-4 h-4 text-red-400" />;
            case 'RUNNING':
                return <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />;
            case 'PENDING':
                return <Clock className="w-4 h-4 text-gray-400" />;
            default:
                return null;
        }
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-800">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-white">Workflow History</h2>
            </div>

            {/* Runs List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    </div>
                ) : runs.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <History className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No runs yet</p>
                        <p className="text-gray-600 text-xs mt-1">
                            Run your workflow to see execution history
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {runs.map((run) => (
                            <div key={run.id} className="p-4">
                                <button
                                    onClick={() => toggleRun(run.id)}
                                    className="w-full text-left"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {expandedRuns.has(run.id) ? (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            )}
                                            <span className="text-sm font-medium text-white">
                                                Run #{run.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        {getStatusBadge(run.status)}
                                    </div>

                                    <div className="ml-6 text-xs text-gray-500">
                                        <p>{formatDate(run.startedAt)}</p>
                                        <p className="flex items-center gap-2 mt-1">
                                            <span>{getScopeLabel(run.scope, run.nodeResults.length)}</span>
                                            {run.duration && (
                                                <>
                                                    <span>•</span>
                                                    <span>{run.duration}ms</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </button>

                                {/* Expanded Node Results */}
                                {expandedRuns.has(run.id) && (
                                    <div className="mt-3 ml-6 space-y-2">
                                        {run.nodeResults.map((result, idx) => (
                                            <div
                                                key={result.id}
                                                className="flex items-start gap-2 text-xs"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {getNodeStatusIcon(result.status)}
                                                    <span className="font-medium text-white truncate">
                                                        {result.nodeType}
                                                    </span>
                                                    {result.duration && (
                                                        <span className="text-gray-500 flex-shrink-0">
                                                            {result.duration}ms
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {run.nodeResults.length === 0 && (
                                            <p className="text-gray-600 text-xs">No node results</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
