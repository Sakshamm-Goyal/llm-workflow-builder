'use client';

import { useCallback, useRef } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    Connection,
    useReactFlow,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '@/components/nodes';
import { useWorkflowStore } from '@/stores/workflow-store';
import { isValidConnection as validateConnection } from '@/lib/workflow-engine/validation';
import { NodeType } from '@/types/nodes';
import FloatingToolbar from '@/components/workflow/FloatingToolbar';

function WorkflowCanvasInner() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const nodes = useWorkflowStore((state) => state.nodes);
    const edges = useWorkflowStore((state) => state.edges);
    const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
    const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
    const onConnect = useWorkflowStore((state) => state.onConnect);
    const addNode = useWorkflowStore((state) => state.addNode);
    const deleteNode = useWorkflowStore((state) => state.deleteNode);
    const setSelectedNodeIds = useWorkflowStore((state) => state.setSelectedNodeIds);

    // Validate connection before allowing it
    const handleConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;

            const sourceNode = nodes.find(n => n.id === connection.source);
            const targetNode = nodes.find(n => n.id === connection.target);

            if (!sourceNode || !targetNode) return;

            const validation = validateConnection(
                sourceNode,
                connection.sourceHandle || 'output',
                targetNode,
                connection.targetHandle || 'input',
                edges
            );

            if (validation.valid) {
                onConnect(connection);
            } else {
                console.warn('Invalid connection:', validation.reason);
                // Could show a toast here
            }
        },
        [nodes, edges, onConnect]
    );

    // Handle drag and drop from sidebar
    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow') as NodeType;

            if (!type || !reactFlowWrapper.current) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(type, position);
        },
        [screenToFlowPosition, addNode]
    );

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                const selectedNodes = nodes.filter(n => n.selected);
                selectedNodes.forEach(node => deleteNode(node.id));
            }
        },
        [nodes, deleteNode]
    );

    // Handle selection change
    const handleSelectionChange = useCallback(
        ({ nodes: selectedNodes }: { nodes: typeof nodes }) => {
            setSelectedNodeIds(selectedNodes.map(n => n.id));
        },
        [setSelectedNodeIds]
    );

    return (
        <div
            ref={reactFlowWrapper}
            className="flex-1 h-full"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onSelectionChange={handleSelectionChange}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[16, 16]}
                defaultEdgeOptions={{
                    animated: true,
                    style: { stroke: '#a855f7', strokeWidth: 2 },
                }}
                proOptions={{ hideAttribution: true }}
                className="bg-gray-950"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#374151"
                />
                <Controls
                    className="bg-gray-800 border-gray-700 [&>button]:bg-gray-800 [&>button]:border-gray-700 [&>button]:text-white [&>button:hover]:bg-gray-700"
                    showZoom={false}
                    showFitView={false}
                    showInteractive={false}
                    position="bottom-left"
                    style={{ display: 'none' }}
                />
                <MiniMap
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'text': return '#3b82f6';
                            case 'uploadImage': return '#8b5cf6';
                            case 'uploadVideo': return '#ec4899';
                            case 'llm': return '#10b981';
                            case 'cropImage': return '#f59e0b';
                            case 'extractFrame': return '#ef4444';
                            default: return '#6b7280';
                        }
                    }}
                    className="bg-gray-800 border-gray-700"
                    maskColor="rgba(0, 0, 0, 0.5)"
                />
                <Panel position="bottom-center">
                    <FloatingToolbar />
                </Panel>
            </ReactFlow>
        </div>
    );
}

export function WorkflowCanvas() {
    return (
        <ReactFlowProvider>
            <WorkflowCanvasInner />
        </ReactFlowProvider>
    );
}
