'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkflowCanvas } from '@/components/workflow';
import IconSidebar from '@/components/workflow/Sidebar/IconSidebar';
import NodeSidebar from '@/components/workflow/Sidebar/NodeSidebar';
import { useWorkflowStore } from '@/stores/workflow-store';
import { Sparkles, Share2, ChevronDown } from 'lucide-react';

export default function WorkflowEditorPage() {
    const params = useParams();
    const workflowId = params?.id as string | undefined;
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const nodes = useWorkflowStore((state) => state.nodes);
    const edges = useWorkflowStore((state) => state.edges);
    const workflowName = useWorkflowStore((state) => state.workflowName);
    const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
    const setWorkflow = useWorkflowStore((state) => state.setWorkflow);
    const setNodeStatus = useWorkflowStore((state) => state.setNodeStatus);
    const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

    // Local state for the canvas name input
    const [localName, setLocalName] = useState(workflowName);

    useEffect(() => {
        setLocalName(workflowName);
    }, [workflowName]);

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setWorkflowName(localName);
            (e.target as HTMLInputElement).blur();
            handleSave();
        }
    };

    const handleNameBlur = () => {
        if (localName !== workflowName) {
            setWorkflowName(localName);
            handleSave();
        }
    };

    // Toggle sidebar sections
    const handleSectionClick = (section: string) => {
        if (activeSection === section) {
            setActiveSection(null);
        } else {
            setActiveSection(section);
        }
    };

    // Load workflow if editing existing
    useEffect(() => {
        const loadWorkflow = async () => {
            if (workflowId && workflowId !== 'new') {
                try {
                    const response = await fetch(`/api/workflows/${workflowId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setWorkflow(data.id, data.name, data.nodes || [], data.edges || []);
                    }
                } catch (error) {
                    console.error('Failed to load workflow:', error);
                }
            }
            setIsLoaded(true);
        };

        loadWorkflow();
    }, [workflowId, setWorkflow]);

    // Handle workflow save
    const handleSave = useCallback(async () => {
        const method = workflowId && workflowId !== 'new' ? 'PUT' : 'POST';
        const url = workflowId && workflowId !== 'new'
            ? `/api/workflows/${workflowId}`
            : '/api/workflows';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: useWorkflowStore.getState().workflowName, // Use latest from store
                nodes,
                edges,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save workflow');
        }

        const data = await response.json();

        // Update URL if new workflow was created
        if (!workflowId || workflowId === 'new') {
            window.history.replaceState({}, '', `/workflows/${data.id}`);
        }
    }, [workflowId, nodes, edges]); // Removed workflowName dependency to usegetState

    // Handle workflow run
    const handleRun = useCallback(async (scope: 'full' | 'selected' | 'single') => {
        const selectedNodeIds = useWorkflowStore.getState().selectedNodeIds;

        // Set all nodes to running
        const nodesToRun = scope === 'full'
            ? nodes
            : nodes.filter(n => selectedNodeIds.includes(n.id));

        nodesToRun.forEach(node => {
            setNodeStatus(node.id, 'running');
        });

        try {
            const response = await fetch('/api/workflows/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workflowId: workflowId || 'temp',
                    nodes,
                    edges,
                    scope: scope === 'full' ? 'FULL' : scope === 'single' ? 'SINGLE' : 'PARTIAL',
                    nodeIds: scope !== 'full' ? selectedNodeIds : undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to execute workflow');
            }

            const result = await response.json();

            // Update node statuses based on results
            result.results?.forEach((nodeResult: { nodeId: string; status: string; output?: unknown; error?: string }) => {
                const status = nodeResult.status === 'SUCCESS' ? 'success' : 'error';
                setNodeStatus(nodeResult.nodeId, status, nodeResult.output, nodeResult.error);

                // Update node data with output/response
                if (nodeResult.output !== undefined) {
                    const node = nodes.find(n => n.id === nodeResult.nodeId);
                    if (node) {
                        if (node.type === 'llm') {
                            updateNodeData(nodeResult.nodeId, { response: nodeResult.output as string });
                        } else {
                            updateNodeData(nodeResult.nodeId, { output: nodeResult.output });
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Workflow execution failed:', error);
            // Set all running nodes to error
            nodesToRun.forEach(node => {
                setNodeStatus(node.id, 'error', undefined, 'Execution failed');
            });
        }
    }, [workflowId, nodes, edges, setNodeStatus, updateNodeData]);

    if (!isLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0E0E10]">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    const isSidebarOpen = activeSection !== null;

    return (
        <div className="h-screen flex bg-[#0E0E10] overflow-hidden">
            {/* Left Sidebars */}
            <IconSidebar
                activeSection={activeSection}
                onSectionClick={handleSectionClick}
            />
            <NodeSidebar
                isOpen={isSidebarOpen}
                onClose={() => setActiveSection(null)}
                onRename={handleSave}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Bar - Only show name input when sidebar is closed */}
                {!isSidebarOpen && (
                    <div className="absolute top-4 left-4 z-40">
                        <input
                            type="text"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            onKeyDown={handleNameKeyDown}
                            onBlur={handleNameBlur}
                            className="bg-[#1C1C1E] border border-[#2C2C2E] text-white text-sm font-medium px-4 py-2 rounded-lg focus:outline-none focus:border-gray-500 w-[160px] transition-colors"
                            placeholder="untitled"
                        />
                    </div>
                )}

                {/* Top Right Controls */}
                <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
                    {/* Credits Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1E] rounded-lg border border-[#2C2C2E]">
                        <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-300">150 credits</span>
                    </div>

                    {/* Share Button */}
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#E1E476] hover:bg-[#d4d765] text-black rounded-lg transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Share</span>
                    </button>
                </div>

                {/* Tasks Dropdown - Below Share */}
                <div className="absolute top-16 right-4 z-40">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#1C1C1E] rounded-lg transition-colors">
                        <span className="text-xs font-medium">Tasks</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Canvas */}
                <WorkflowCanvas />
            </div>
        </div>
    );
}
