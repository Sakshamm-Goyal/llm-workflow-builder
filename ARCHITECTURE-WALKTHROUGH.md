# Weavy-Clone — End-to-End Architecture Walkthrough

**Har ek file ka role, flow mein kahan aata hai, aur kuch miss na ho — step-by-step.**

---

## Part 1: App Entry & Routing

### 1. `src/app/layout.tsx` (Root layout)
- **Kya karta hai:** Saari pages ke around wrapper. **ClerkProvider** se auth context provide karta hai. Fonts (Inter, DM Sans, DM Mono) load. **Dark theme** by default (`className="dark"`).
- **Flow:** Har request pe yeh layout run hota hai → `children` = current page (e.g. `/` ya `/dashboard`).

### 2. `src/middleware.ts`
- **Kya karta hai:** **Clerk** ka middleware. Har request pe check: agar route **public** nahi hai to user signed in hai ya nahi.
- **Public routes:** `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/upload/params`, `/api/webhooks(.*)`, `/api/process(.*)`.
- **Protected:** Baaki sab. Agar `userId` nahi → `redirectToSignIn()`.
- **Flow:** Request aate hi middleware chalta hai → public ho to aage; protected ho to auth check → fail = redirect sign-in.

### 3. `src/app/page.tsx` (Landing – `/`)
- **Kya karta hai:** Home page. **Server component.** `auth()` se `userId` nikalta hai. Agar **userId hai** → `redirect("/dashboard")`. Agar nahi → **LandingHeader** + **LandingHero** dikhata hai.
- **Flow:** User `/` pe aata hai → logged in hai to dashboard, nahi to landing.

### 4. `src/app/(auth)/sign-in/[[...sign-up]]/page.tsx` & `sign-up`
- **Kya karta hai:** Clerk ke sign-in/sign-up routes. User yahan se login/signup karta hai.
- **Flow:** Middleware redirect yahan bhej sakta hai; login ke baad user dashboard/workflows pe jaata hai.

---

## Part 2: Protected Area (Dashboard & Workflow Editor)

### 5. `src/app/(protected)/layout.tsx`
- **Kya karta hai:** **Protected layout.** `auth()` se `userId` check. Agar **nahi** hai → `redirect('/sign-in')`. Agar hai → `children` render (dashboard ya workflow page).
- **Flow:** `/dashboard`, `/workflows/...` sab is layout ke andar; pehle auth, phir content.

### 6. `src/app/(protected)/dashboard/page.tsx` (Dashboard – `/dashboard`)
- **Kya karta hai:** **Client component.** User ka workspace: workflow list, create new, sample load, search, grid/list view, context menu (open, duplicate, rename, delete).
- **Important:**
  - **useEffect:** `fetchWorkflows()` → `GET /api/workflows` → list `workflows` state mein.
  - **handleCreateNew:** `POST /api/workflows` with `{ name: 'untitled', nodes: [], edges: [] }` → response se `workflow.id` → `router.push(\`/workflows/${id}\`)`.
  - **handleLoadSample:** Same POST with `PRODUCT_MARKETING_KIT` nodes/edges → then push to that workflow.
  - **handleOpen:** `router.push(\`/workflows/${workflowId}\`)`.
  - **Rename:** `PATCH /api/workflows/:id` with `{ name }`. **Delete:** `DELETE /api/workflows/:id`. **Duplicate:** `POST /api/workflows/:id/duplicate`.
- **Flow:** Dashboard load → API se workflows → user create/open/rename/delete/duplicate → navigation to `/workflows/:id`.

---

## Part 3: Workflow Editor Page (Canvas + Sidebars + Header)

### 7. `src/app/(protected)/workflows/[[...id]]/page.tsx` (Editor – `/workflows/:id` or `/workflows/new`)
- **Kya karta hai:** Workflow editor page. **Client component.** `params.id` = workflow id (ya `undefined` for `/workflows`). `searchParams.template` = optional template.
- **Store use:** `useWorkflowStore` se nodes, edges, workflowName, setWorkflow, loadWorkflow, saveWorkflow, setNodeStatus, updateNodeData.
- **Load:** `useEffect`: agar `workflowId && workflowId !== 'new'` → `loadWorkflow(workflowId)` (store se `GET /api/workflows/:id` karke nodes/edges set).
- **Save:** `handleSave` → `saveWorkflow()`. **Auto-save:** 2 sec debounce on nodes/edges/workflowName change.
- **Run:** `handleRun(scope)` yahan define hai → nodes to run ko `setNodeStatus(..., 'running')` → `POST /api/workflows/execute` with workflowId, nodes, edges, scope, nodeIds → response `results` pe loop → `setNodeStatus` + `updateNodeData` (output/response/error).
- **Layout:** **IconSidebar** (left) → **NodeSidebar** (slide-out) → **WorkflowHeader** (name, save, share, tasks, import/export) + **WorkflowCanvas** → **PropertiesSidebar** (right). **onRun** = `handleRun` → **WorkflowHeader** ko pass nahi hota (header mein run button nahi), lekin **WorkflowCanvas** ke andar **FloatingToolbar** ko run milta hai (next file).
- **Flow:** URL `/workflows/xyz` → load workflow → canvas + sidebars render → user edit/save/run from canvas toolbar.

---

## Part 4: Canvas & Toolbar (Run Trigger, Connections, Drag-Drop)

### 8. `src/components/workflow/WorkflowCanvas.tsx`
- **Structure:** **WorkflowCanvas** = `ReactFlowProvider` → **WorkflowCanvasInner** (actual canvas).
- **Store:** nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, deleteNode, setSelectedNodeIds, selectedNodeIds, selectedEdgeId, deleteEdge, undo, redo, updateNodeData. **Tool:** `useCanvasToolStore` → activeTool (select / pan).
- **handleRun(scope):**  
  - `setIsExecuting(true)`.  
  - Scope ke hisaab se nodesToRun. Sab pe `updateNodeData(id, { status: 'running' })`.  
  - `POST /api/workflows/execute` with workflowId, nodes, edges, scope, nodeIds.  
  - Response `results` → har node pe `updateNodeData(nodeId, { status, output, error })`.  
  - Error pe nodesToRun ko `status: 'error'`.  
  - `finally` → `setIsExecuting(false)`.
- **Connections:**  
  - **handleConnect:** source/target + handles pe `validateConnection` (validation.ts) → valid ho to **onConnect(connection)** (store addEdge + history).  
  - **isValidConnectionCallback:** drag ke time visual feedback ke liye same validation.
- **onConnectEnd:** Agar connection invalid (e.g. empty pane pe drop) → **ContextConnectionMenu** dikhata hai; user node type choose kare → **handleContextSelect** → `addNode(type, flow)` + `onConnect` source → new node (target handle type ke hisaab se).
- **Drag from sidebar:** **onDragOver** allow, **onDrop** → `event.dataTransfer.getData('application/reactflow')` = node type → `screenToFlowPosition` → **addNode(type, position)**.
- **Keyboard:** Delete/Backspace → selected edge delete ya selected nodes delete. **Ctrl/Cmd+R** → **handleRun('full')**. Ctrl+Z / Ctrl+Shift+Z → undo/redo.
- **ReactFlow props:** nodes, edges, onNodesChange, onEdgesChange, onConnect, nodeTypes, edgeTypes, connectionLineComponent, fitView, snapToGrid, Background, MiniMap, **FloatingToolbar** (Panel bottom-center) with **onRun={handleRun}**, **isExecuting**.
- **Flow:** Canvas = single source of truth (store). Run = FloatingToolbar se handleRun → execute API. Add node = sidebar drag ya connection menu. Connections = validation se allow/block.

### 9. `src/components/workflow/FloatingToolbar.tsx`
- **Kya karta hai:** Bottom-center toolbar: **Select / Pan** tool, **Undo / Redo**, **Run** dropdown, node count, zoom.
- **Run:** Button click → dropdown: "Run Full Workflow (⌘R)", "Run Selected Nodes". **handleRun(scope)** = `onRun(scope)` (parent se = WorkflowCanvas ka handleRun). Disabled when `isExecuting || nodes.length === 0`. "Run Selected" disabled when `selectedNodeIds.length === 0`.
- **Flow:** User "Run" → full ya selected → parent handleRun → same execute API call.

---

## Part 5: Header, Sidebars, History

### 10. `src/components/workflow/WorkflowHeader.tsx`
- **Kya karta hai:** Top bar: workflow name input, HistorySidebar (Tasks), Save, Share, Export/Import JSON. **onRun** prop hai but header mein run button nahi dikh raha (run canvas toolbar se hi hai).
- **Save:** `onSave()` (page se = saveWorkflow). **Export:** workflow name, nodes, edges → JSON download. **Import:** file pick → setNodes, setEdges, setWorkflowName.

### 11. `src/components/workflow/Sidebar/NodeSidebar.tsx`
- **Kya karta hai:** Left slide-out: workflow name edit, search, **TOOLBOX_NODES** (LLM, Text, Image Upload, Video Upload, Crop Image, Extract Frame). Har type ke liye **NodeCard** → **onDragStart** mein `event.dataTransfer.setData('application/reactflow', type)`.
- **Flow:** User node type drag karke canvas pe drop → WorkflowCanvas **onDrop** → addNode(type, position).

### 12. `src/components/workflow/Sidebar/IconSidebar.tsx`
- **Kya karta hai:** Left icon bar: sections (e.g. nodes) click → NodeSidebar open/close (activeSection).

### 13. `src/components/workflow/Sidebar/PropertiesSidebar.tsx`
- **Kya karta hai:** Right sidebar: selected node/edge ki properties. **Run selected** button → `handleRunSelected` → direct `POST /api/workflows/execute` with scope PARTIAL and selected node ids (store se). Same flow: run → results → node status update.

### 14. `src/components/workflow/HistorySidebar.tsx`
- **Kya karta hai:** **Tasks** panel. `workflowId` pe **GET /api/workflows/:id/runs** (polling bhi) → runs list. Har run expand → nodeResults dikhate hain (nodeId, status, duration, etc.).

---

## Part 6: State (Stores)

### 15. `src/stores/workflow-store.ts`
- **Kya karta hai:** Zustand store (persist + devtools + immer). **State:** workflowId, workflowName, nodes, edges, selectedNodeIds, selectedEdgeId, isExecuting, executingNodeIds, history (undo/redo), historyIndex.
- **Actions:**  
  - **setWorkflow(id, name, nodes, edges)** – load/set full workflow.  
  - **addNode(type, position, initialData)** – NODE_CONFIG se default data + newNode push; saveToHistory.  
  - **updateNodeData(nodeId, data)** – node.data merge.  
  - **deleteNode(nodeId)** – node + uske edges remove; saveToHistory.  
  - **onNodesChange / onEdgesChange** – React Flow changes apply.  
  - **onConnect(connection)** – edge add (with color from connector-colors); saveToHistory.  
  - **deleteEdge(edgeId)**.  
  - **setNodeStatus(nodeId, status, output?, error?)** – node.data.status/output/error.  
  - **saveToHistory** – current nodes/edges history stack mein (max 50). **undo/redo** – historyIndex se restore.  
  - **createNewWorkflow** – POST /api/workflows → set new id, empty nodes/edges.  
  - **saveWorkflow** – workflowId nahi to POST, else PATCH /api/workflows/:id.  
  - **loadWorkflow(id)** – GET /api/workflows/:id → setWorkflow.  
  - **duplicateWorkflow** – POST create ya POST .../duplicate.
- **Persist:** workflowId, workflowName, nodes, edges → localStorage (key: weavy-workflow-store).
- **Flow:** Canvas + header + sidebars sab is store ko read/update karte hain; run ke time nodes/edges yahi se API ko bheje jaate hain.

### 16. `src/stores/ui-store.ts`
- **Kya karta hai:** UI state (e.g. isHistoryOpen, toggleHistory) – Tasks panel open/close.

### 17. `src/stores/canvas-tool-store.ts`
- **Kya karta hai:** activeTool = 'select' | 'pan'. setActiveTool. Canvas interaction (draggable, connectable, etc.) isi se derive.

---

## Part 7: Node Types & Validation

### 18. `src/types/nodes.ts`
- **Kya karta hai:** **NodeType** union, **HandleType**, **NODE_CONFIG** (har type ke liye label, color, icon, **inputs** [], **outputs** []). Data interfaces: TextNodeData, UploadImageNodeData, LLMNodeData, CropImageNodeData, ExtractFrameNodeData, etc.
- **Flow:** Validation and store addNode is config use karte hain (defaults + handle ids).

### 19. `src/lib/workflow-engine/validation.ts`
- **isValidConnection(sourceNode, sourceHandle, targetNode, targetHandle, edges):**  
  - Self-connect block.  
  - NODE_CONFIG se source output / target input handle.  
  - Type compatibility (text/image/video/any).  
  - Target handle pe pehle se connection (except LLM 'images').  
  - **wouldCreateCycle** – BFS from target to source; agar source reach ho to cycle = invalid.  
  - Return { valid, reason? }.
- **topologicalSort(nodes, edges):** Kahn's algorithm. In-degree compute → layers of node ids (layer 0 = no incoming; next layers = jinke sab predecessors previous layers mein). Return `string[][]` (har layer parallel run ho sakta hai).
- **getConnectedInputs(nodeId, nodes, edges):** Incoming edges se source node ka `data.output` → map by targetHandle. 'images' handle multiple values array mein.
- **getUpstreamNodes / getDownstreamNodes:** BFS from nodeId backward/forward on edges.
- **isValidDAG:** topologicalSort ke baad saare nodes kisi layer mein hon (no cycle).
- **Flow:** Canvas connection allow/deny + execute route ko layers aur inputs dene ke liye use.

---

## Part 8: API Routes (Backend)

### 20. `src/lib/db.ts`
- **Kya karta hai:** PrismaClient singleton (dev mein globalThis pe cache). Saari API routes `import prisma from '@/lib/db'` use karti hain.

### 21. `src/app/api/workflows/route.ts`
- **GET:** auth → get/create User by clerkId (currentUser se email, name). **prisma.workflow.findMany({ where: { userId } })** → list (id, name, description, dates, _count.runs). Return { workflows }.
- **POST:** auth → body validate (createWorkflowSchema: name, optional description, nodes, edges). Get/create user. **prisma.workflow.create** → return { workflow }.
- **Flow:** Dashboard list + create new workflow.

### 22. `src/app/api/workflows/[id]/route.ts`
- **GET:** auth → user by clerkId. **prisma.workflow.findFirst({ where: { id, userId } })** → return workflow (nodes, edges included).
- **PATCH/PUT:** auth → body (name?, nodes?, edges?) validate → ownership check → **prisma.workflow.update**.
- **DELETE:** auth → ownership → **prisma.workflow.delete**.
- **Flow:** Load one workflow, save (update), delete.

### 23. `src/app/api/workflows/[id]/duplicate/route.ts`
- **POST:** auth → get workflow (ownership) → create new workflow with same name (Copy), nodes, edges, new id → return { workflow }. Flow: Dashboard/sidebar duplicate.

### 24. `src/app/api/workflows/[id]/runs/route.ts`
- **GET:** auth → user → **prisma.workflowRun.findMany({ where: { workflowId, userId }, orderBy, take: 50, include: { nodeResults } })**. Flow: HistorySidebar runs list.

---

## Part 9: Execute API (Execution Engine)

### 25. `src/app/api/workflows/execute/route.ts`
- **POST only.** Body: workflowId, nodes, edges, scope ('FULL'|'PARTIAL'|'SINGLE'), nodeIds? (for PARTIAL/SINGLE).
- **Auth:** Clerk userId → prisma user. Fail → 401/404.
- **Scope:**  
  - FULL → nodesToExecute = nodes.  
  - PARTIAL/SINGLE + nodeIds → nodeIds + (SINGLE pe BFS backward on edges se saare upstream bhi) → nodesToExecute = filter nodes by this set.
- **DB:** **prisma.workflowRun.create** (workflowId, userId, scope, status: RUNNING).
- **Layers:** **topologicalSort(nodesToExecute, edges)** → executionLayers (array of layers).
- **nodeOutputs:** Map. Pehle existing node.data.output se initialize.
- **Loop:** Har **layer** ke liye:  
  - Har **nodeId** in layer ke liye async function: find node → **NodeResult** create (RUNNING).  
  - **Inputs:** getConnectedInputs(nodeId, nodes, edges) + edges se **nodeOutputs** se overwrite (runtime outputs).  
  - **Switch node.type:**  
    - **text:** output = data.text.  
    - **uploadImage:** output = data.imageUrl (blob check → error).  
    - **uploadVideo:** output = data.output ?? data.videoUrl (blob check).  
    - **llm:** SKIP_TRIGGER_DEV ? executeLLM() : executeLLMViaTrigger() → poll.  
    - **cropImage:** same pattern → executeCropImage vs executeCropImageViaTrigger.  
    - **extractFrame:** same → executeExtractFrame vs executeExtractFrameViaTrigger.  
  - nodeOutputs.set(nodeId, output). NodeResult update (SUCCESS/FAILED, input, output, duration). results[] push.
- **End:** Run status (SUCCESS/PARTIAL/FAILED) + completedAt, duration → **prisma.workflowRun.update**. Return { runId, status, results, duration }.
- **Trigger.dev:** executeLLMViaTrigger etc. → **tasks.trigger('llm-execution', payload)** then **runs.poll(handle.id)** with timeout. Fail/Timeout → fallback direct executeLLM/executeCropImage/executeExtractFrame.
- **Direct execution:** executeLLM → Groq (model groq:...) ya Gemini; executeCropImage/executeExtractFrame → **POST /api/process** (Transloadit) with fileUrl + options.
- **Flow:** Client POST with nodes/edges/scope → auth → layers → layer-by-layer run → DB run + node results → response → client node status/output update.

---

## Part 10: Upload & Process (Transloadit)

### 26. `src/app/api/upload/params/route.ts`
- **POST:** body { type?: 'image' | 'video' }. Transloadit **params** (auth key, expiry 1hr, steps). Image: `:original` + `optimized` (image/optimize). Video: `:original`. **Signature** = HMAC SHA-384 with TRANSLOADIT_AUTH_SECRET. Return { params, signature, authKey }.
- **Flow:** UploadImageNode/UploadVideoNode pehle yahan se signed params leta hai, phir client direct Transloadit assemblies ko POST karta hai (file + params + signature).

### 27. `src/app/api/process/route.ts`
- **POST:** body: type ('crop' | 'frame'), fileUrl, options (crop: x,y,width,height; frame: timestamp). Transloadit assembly create: **/http/import** (url=fileUrl) → crop: **/image/resize** (crop, result:true) ya frame: **/video/thumbs** (offsets, result:true). Signature, POST to Transloadit, **pollForCompletion** → result URL. Return { success, resultUrl, assemblyId }.
- **Flow:** Execute route jab SKIP_TRIGGER_DEV ya fallback use kare to crop/frame ke liye yahi route call hota hai (server-side Transloadit).

---

## Part 11: Node Components (Brief)

### 28. `src/components/nodes/index.ts`
- **nodeTypes** object: text → TextNode, uploadImage → UploadImageNode, uploadVideo → UploadVideoNode, llm → LLMNode, cropImage → CropImageNode, extractFrame → ExtractFrameNode. React Flow isi ko nodeTypes prop mein use karta hai.

### 29. UploadImageNode / UploadVideoNode
- **Upload flow:** User file drop → **POST /api/upload/params** { type: 'image'|'video' } → params + signature. **FormData:** params, signature, file → **POST https://api2.transloadit.com/assemblies** → poll assembly_ssl_url until ASSEMBLY_COMPLETED → result URL (optimized[0].ssl_url ya uploads). **updateNodeData(id, { imageUrl } or { videoUrl/output })**.
- **Execution time:** Execute route node.data.imageUrl / videoUrl read karta hai (upload pehle ho chuka hota hai).

### 30. LLMNode
- Inputs: system_prompt, user_message, images (handles). Model select. Run button → **POST /api/workflows/execute** with scope SINGLE, nodeIds = [this node id] (execute route upstream bhi add karta hai). Response → updateNodeData(response).

### 31. TextNode, CropImageNode, ExtractFrameNode
- TextNode: data.text output. CropImageNode: image_url input + dimensions from data; output = cropped URL. ExtractFrameNode: video_url + timestamp → frame URL. Execution in execute route (switch by type).

---

## Part 12: Trigger.dev (Optional)

### 32. `trigger.config.ts`
- **dirs:** `['./src/trigger']`. Project id, runtime node. Repo mein abhi **src/trigger/example.ts** hi hai (hello-world task). Execute route task ids **llm-execution**, **crop-image**, **extract-frame** use karta hai — ye tasks agar deploy hon to Trigger.dev worker inko run karta hai; nahi to SKIP_TRIGGER_DEV ya fallback direct/process route.

---

## Part 13: Flow Summary (Ek Nazar Mein)

1. **Entry:** layout (Clerk) → middleware (auth) → / → dashboard if logged in.
2. **Dashboard:** GET /api/workflows → list. Create → POST /api/workflows → push /workflows/:id. Open/duplicate/rename/delete via API.
3. **Editor:** /workflows/:id → loadWorkflow (GET :id) → store set. Canvas = ReactFlow + store (nodes, edges). Add node = NodeSidebar drag ya connection menu drop. Connect = validation → onConnect (store).
4. **Run:** FloatingToolbar (or PropertiesSidebar "Run selected" ya Cmd+R) → handleRun(scope) → POST /api/workflows/execute (workflowId, nodes, edges, scope, nodeIds) → API: topologicalSort → layer-by-layer run, har node ke liye getConnectedInputs + nodeOutputs, type-wise execute (text/upload/llm/crop/frame), Trigger.dev ya direct/process → DB WorkflowRun + NodeResult → response results → client updateNodeData(status, output, error).
5. **Upload:** Node pe file drop → /api/upload/params → Transloadit upload + poll → updateNodeData(url). Run time pe sirf ye URL use hota hai.
6. **Save:** Store saveWorkflow → PATCH /api/workflows/:id (ya POST if new). Auto-save bhi same, debounced.

---

**Yahi end-to-end flow hai — entry se run tak, bina kuch miss kiye.**
