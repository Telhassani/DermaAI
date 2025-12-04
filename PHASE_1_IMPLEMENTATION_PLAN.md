# Phase 1 Enhancement Implementation Plan
## Lab Conversations - 5 Quick Wins with Backend Storage

**Status**: ✅ Ready for Approval and Implementation
**Date**: 2025-12-02
**Estimated Timeline**: 20-24 hours (detailed breakdown included)
**Priority**: ALL 5 features must be implemented (not optional)
**Database Storage**: Required for message regeneration history (NOT localStorage)

---

## Executive Summary

This plan details the implementation of 5 Phase 1 quick wins to enhance the Lab Conversations section. Each feature is designed to improve user experience and save time during medical consultations. All features require backend database storage for data persistence and proper audit trails.

**Quick Wins Overview:**
1. ✨ **Copy to Clipboard** - Single-click message copying with toast feedback
2. 🔄 **Message Regeneration** - Regenerate AI responses with version history
3. 📋 **Prompt Templates** - Pre-built templates for common analysis queries
4. 📤 **Enhanced File Upload** - Drag-drop, paste, and batch upload support
5. 🏷️ **Auto-Generated Titles** - AI-generated conversation titles on first interaction

---

## Part 1: Database Schema Changes

### 1.1 New Table: `lab_message_versions`

This table stores regenerated message versions for audit trail and user switching between versions.

```sql
CREATE TABLE lab_message_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL FOREIGN KEY REFERENCES lab_messages(id),
    version_number INTEGER NOT NULL,  -- 1, 2, 3, etc. (1 is original)
    content TEXT NOT NULL,
    model_used VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    processing_time_ms INTEGER,
    is_current BOOLEAN DEFAULT FALSE,  -- Current active version
    regeneration_reason VARCHAR(255),  -- Why was it regenerated?
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, version_number),
    INDEX(message_id),
    INDEX(is_current)
);
```

**Purpose**:
- Track all regenerated versions of AI responses
- Allow user to switch between different versions
- Maintain audit trail for compliance
- Calculate token usage across regenerations

### 1.2 Update: `lab_conversations` table

Add column for storing auto-generated title state:

```sql
ALTER TABLE lab_conversations ADD COLUMN (
    title_auto_generated BOOLEAN DEFAULT FALSE,
    original_title VARCHAR(255) -- Store original auto-generated title before user edit
);
```

**Purpose**:
- Track whether title was auto-generated or user-provided
- Re-generate title only if not manually edited

### 1.3 New Table: `prompt_templates`

Store reusable prompt templates for quick access:

```sql
CREATE TABLE prompt_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL FOREIGN KEY REFERENCES users(id),
    category VARCHAR(100),  -- e.g., "lab_analysis", "image_analysis", "drug_check"
    title VARCHAR(255) NOT NULL,
    template_text TEXT NOT NULL,  -- Template with {{placeholders}}
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,  -- System templates available to all
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX(doctor_id),
    INDEX(category),
    INDEX(is_active)
);
```

**Purpose**:
- Store user's frequently used prompts
- Track system templates vs custom templates
- Track usage statistics for popular templates

---

## Part 2: Backend Models & Schemas

### 2.1 Add LabMessageVersion Model

**File**: `backend/app/models/lab_conversation.py`

```python
class LabMessageVersion(Base):
    """
    Version history for regenerated AI messages
    Tracks all iterations of an AI response
    """
    __tablename__ = "lab_message_versions"

    id = Column(Integer, primary_key=True, index=True)

    # Message reference
    message_id = Column(Integer, ForeignKey("lab_messages.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.

    # Content
    content = Column(Text, nullable=False)

    # AI metadata
    model_used = Column(String(100), nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    # Version management
    is_current = Column(Boolean, default=False, index=True)
    regeneration_reason = Column(String(255), nullable=True)  # e.g., "User regenerated"

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    message = relationship("LabMessage", backref="versions")

    __table_args__ = (
        UniqueConstraint('message_id', 'version_number', name='unique_message_version'),
    )
```

**Also update LabMessage model**:
- Add `current_version_number = Column(Integer, default=1)` to track active version
- Add `has_versions = Column(Boolean, default=False)` for quick filtering

### 2.2 Add PromptTemplate Model

**File**: `backend/app/models/lab_conversation.py`

```python
class PromptTemplate(Base):
    """
    Reusable prompt templates for quick message composition
    """
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)

    # Owner
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Template content
    category = Column(String(100), nullable=True, index=True)  # "lab_analysis", "image_analysis"
    title = Column(String(255), nullable=False)
    template_text = Column(Text, nullable=False)
    description = Column(Text, nullable=True)

    # System vs custom
    is_system = Column(Boolean, default=False)  # System templates available to all

    # Usage tracking
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    doctor = relationship("User", backref="prompt_templates")
```

### 2.3 Update LabMessage Model

Add fields to track versioning:

```python
class LabMessage(Base):
    __tablename__ = "lab_messages"

    # ... existing fields ...

    # Version tracking (NEW)
    current_version_number = Column(Integer, default=1)
    has_versions = Column(Boolean, default=False)  # Optimization: quick check if versions exist
```

### 2.4 Create Pydantic Schemas

**File**: `backend/app/schemas/lab_conversation.py`

Add these schemas:

```python
class MessageVersionResponse(BaseModel):
    """Response for a specific message version"""
    id: int
    message_id: int
    version_number: int
    content: str
    model_used: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    processing_time_ms: Optional[int] = None
    is_current: bool
    regeneration_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageWithVersionsResponse(MessageResponse):
    """Message response with version metadata"""
    current_version_number: int
    has_versions: bool
    versions_count: Optional[int] = None  # If including all versions


class PromptTemplateBase(BaseModel):
    """Base prompt template schema"""
    title: str = Field(..., min_length=1, max_length=255)
    template_text: str = Field(..., min_length=1, max_length=5000)
    description: Optional[str] = None
    category: Optional[str] = None


class PromptTemplateCreate(PromptTemplateBase):
    """Create prompt template"""
    pass


class PromptTemplateUpdate(BaseModel):
    """Update prompt template"""
    title: Optional[str] = None
    template_text: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class PromptTemplateResponse(PromptTemplateBase):
    """Prompt template response"""
    id: int
    doctor_id: int
    is_system: bool
    usage_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PromptTemplateListResponse(BaseModel):
    """Paginated prompt template list"""
    items: List[PromptTemplateResponse]
    total: int
    skip: int
    limit: int


class RegenerateMessageRequest(BaseModel):
    """Request to regenerate a message"""
    message_id: int
    model: Optional[str] = None  # Use conversation default if not specified
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = None
    regeneration_reason: Optional[str] = None


class SwitchMessageVersionRequest(BaseModel):
    """Request to switch to a different message version"""
    message_id: int
    version_number: int
```

---

## Part 3: Backend API Endpoints

### 3.1 Message Regeneration Endpoints

**File**: `backend/app/api/v1/lab_conversations.py`

#### POST `/conversations/{conversation_id}/messages/{message_id}/regenerate`

```python
@router.post(
    "/conversations/{conversation_id}/messages/{message_id}/regenerate",
    response_model=MessageWithVersionsResponse,
    status_code=200,
    summary="Regenerate an AI message with new version",
    tags=["Lab Conversations - Message Versions"]
)
@limiter.limit("5/minute")  # Rate limit: 5 regenerations per minute
async def regenerate_message(
    conversation_id: int,
    message_id: int,
    request: RegenerateMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Regenerate an AI response with new parameters.

    Creates a new version of the message while preserving the original.
    User can switch between versions.

    - **conversation_id**: ID of the conversation
    - **message_id**: ID of the message to regenerate
    - **model**: AI model to use (optional, uses conversation default if not specified)
    - **temperature**: Sampling temperature (optional)
    - **max_tokens**: Maximum tokens (optional)
    - **regeneration_reason**: Reason for regeneration (optional, for audit trail)

    Returns: Updated message with new version metadata
    """
    # Verify conversation belongs to user
    conversation = LabConversationService.get_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Verify message exists and belongs to conversation
    message = LabMessageService.get_message(db, message_id)
    if not message or message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="Message not found")

    # Can only regenerate ASSISTANT messages
    if message.role != MessageRole.ASSISTANT:
        raise HTTPException(status_code=400, detail="Can only regenerate AI assistant messages")

    # Get previous user message for context
    messages, _ = LabMessageService.list_messages(db, conversation_id, skip=0, limit=100)
    user_message = None
    for msg in messages:
        if msg.id < message_id and msg.role == MessageRole.USER:
            user_message = msg

    if not user_message:
        raise HTTPException(status_code=400, detail="No user message found to regenerate from")

    # Build message history
    message_history = []
    for msg in messages:
        if msg.id <= message_id:
            message_history.append({
                "role": msg.role.value.lower(),
                "content": msg.content,
            })

    # Get AI service and validate model
    ai_service = get_ai_service()
    model = request.model or conversation.default_model or "claude-sonnet-4-5-20250929"

    if not ai_service.validate_model(model):
        raise HTTPException(status_code=400, detail=f"Invalid model: {model}")

    # Generate new response
    temperature = request.temperature or conversation.temperature

    # Stream and collect response (similar to stream endpoint)
    accumulated_content = ""
    start_time = time.time()

    async for chunk in ai_service.stream_message(
        model=model,
        messages=message_history,
        temperature=temperature,
        max_tokens=request.max_tokens,
        system_prompt=conversation.system_prompt,
    ):
        if chunk:
            accumulated_content += chunk

    elapsed_time = time.time() - start_time

    # Create new version in database
    new_version = LabMessageVersionService.create_version(
        db,
        message_id=message_id,
        content=accumulated_content,
        model_used=model,
        regeneration_reason=request.regeneration_reason or "User regenerated",
        processing_time_ms=int(elapsed_time * 1000),
    )

    # Update message to point to new version
    message = LabMessageService.get_message(db, message_id)
    message.current_version_number = new_version.version_number
    message.has_versions = True
    db.commit()

    log_audit_event(current_user, "REGENERATE_MESSAGE", f"message_id={message_id}, new_version={new_version.version_number}")

    return message
```

#### GET `/conversations/{conversation_id}/messages/{message_id}/versions`

```python
@router.get(
    "/conversations/{conversation_id}/messages/{message_id}/versions",
    response_model=List[MessageVersionResponse],
    summary="Get all versions of a message",
    tags=["Lab Conversations - Message Versions"]
)
async def get_message_versions(
    conversation_id: int,
    message_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all versions of a specific message (for regenerated responses).

    Returns list of all versions in creation order, with metadata about each.
    """
    # Verify conversation and message
    conversation = LabConversationService.get_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message = LabMessageService.get_message(db, message_id)
    if not message or message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="Message not found")

    # Get all versions
    versions = LabMessageVersionService.get_versions(db, message_id)

    log_audit_event(current_user, "VIEW_MESSAGE_VERSIONS", f"message_id={message_id}")

    return versions
```

#### PATCH `/conversations/{conversation_id}/messages/{message_id}/switch-version`

```python
@router.patch(
    "/conversations/{conversation_id}/messages/{message_id}/switch-version",
    response_model=MessageWithVersionsResponse,
    summary="Switch to a different version of a message",
    tags=["Lab Conversations - Message Versions"]
)
async def switch_message_version(
    conversation_id: int,
    message_id: int,
    request: SwitchMessageVersionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Switch the active version of a message.

    User can switch between regenerated versions to use the best response.
    """
    # Verify conversation and message
    conversation = LabConversationService.get_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message = LabMessageService.get_message(db, message_id)
    if not message or message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="Message not found")

    # Verify version exists
    version = LabMessageVersionService.get_version(db, message_id, request.version_number)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Update message to use this version
    message.current_version_number = request.version_number
    db.commit()

    log_audit_event(current_user, "SWITCH_MESSAGE_VERSION",
                   f"message_id={message_id}, version={request.version_number}")

    return message
```

### 3.2 Prompt Template Endpoints

**File**: `backend/app/api/v1/lab_conversations.py`

#### POST `/conversations/prompt-templates`

```python
@router.post(
    "/prompt-templates",
    response_model=PromptTemplateResponse,
    status_code=201,
    summary="Create a new prompt template",
    tags=["Lab Conversations - Templates"]
)
@limiter.limit("20/minute")
async def create_prompt_template(
    data: PromptTemplateCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new reusable prompt template for quick access."""
    template = PromptTemplateService.create_template(db, current_user.id, data)
    log_audit_event(current_user, "CREATE_PROMPT_TEMPLATE", f"template_id={template.id}")
    return template
```

#### GET `/conversations/prompt-templates`

```python
@router.get(
    "/prompt-templates",
    response_model=PromptTemplateListResponse,
    summary="List all prompt templates",
    tags=["Lab Conversations - Templates"]
)
async def list_prompt_templates(
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all templates (both system and user-created)."""
    templates, total = PromptTemplateService.list_templates(
        db, current_user.id, category=category, skip=skip, limit=limit
    )
    return {
        "items": templates,
        "total": total,
        "skip": skip,
        "limit": limit,
    }
```

#### PATCH `/conversations/prompt-templates/{template_id}`

```python
@router.patch(
    "/prompt-templates/{template_id}",
    response_model=PromptTemplateResponse,
    summary="Update a prompt template",
    tags=["Lab Conversations - Templates"]
)
async def update_prompt_template(
    template_id: int,
    data: PromptTemplateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update an existing prompt template."""
    template = PromptTemplateService.update_template(db, template_id, current_user.id, data)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    log_audit_event(current_user, "UPDATE_PROMPT_TEMPLATE", f"template_id={template_id}")
    return template
```

#### DELETE `/conversations/prompt-templates/{template_id}`

```python
@router.delete(
    "/prompt-templates/{template_id}",
    status_code=204,
    summary="Delete a prompt template",
    tags=["Lab Conversations - Templates"]
)
async def delete_prompt_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a prompt template."""
    success = PromptTemplateService.delete_template(db, template_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")

    log_audit_event(current_user, "DELETE_PROMPT_TEMPLATE", f"template_id={template_id}")
```

### 3.3 Conversation Title Auto-Generation

Update existing POST `/conversations/{conversation_id}/stream-response` endpoint to generate title on first message:

```python
# In generate_ai_response_stream() function, after stream completes:

# Generate title if this is the first AI message
if conversation.message_count <= 1:
    title_task = asyncio.create_task(
        ai_service.generate_conversation_title(
            user_message.content,
            accumulated_content[:500]  # First 500 chars of response
        )
    )
    try:
        auto_title = await asyncio.wait_for(title_task, timeout=5.0)
        if auto_title:
            conversation.title = auto_title
            conversation.title_auto_generated = True
            db.commit()
    except asyncio.TimeoutError:
        pass  # Skip title generation on timeout
```

---

## Part 4: Frontend Components & State Management

### 4.1 Update Zustand Store

**File**: `frontend/src/lib/stores/useConversationStore.ts`

Add new state slices:

```typescript
interface VersionState {
  messageVersions: Record<number, MessageVersion[]>  // message_id -> versions
  currentVersions: Record<number, number>  // message_id -> current_version_number
  loadingVersions: Record<number, boolean>
  errorVersions: Record<number, string | null>
}

interface TemplateState {
  templates: PromptTemplate[]
  loadingTemplates: boolean
  errorTemplates: string | null
}

// Add to useConversationStore:
const versionState = create<VersionState>((set) => ({
  messageVersions: {},
  currentVersions: {},
  loadingVersions: {},
  errorVersions: {},
}))

const templateState = create<TemplateState>((set) => ({
  templates: [],
  loadingTemplates: false,
  errorTemplates: null,
}))

// Add action creators:
setMessageVersions: (messageId: number, versions: MessageVersion[]) => { ... }
switchMessageVersion: (messageId: number, versionNumber: number) => { ... }
regenerateMessage: (messageId: number, request: RegenerateRequest) => { ... }
loadTemplates: () => { ... }
createTemplate: (template: PromptTemplateCreate) => { ... }
deleteTemplate: (templateId: number) => { ... }
```

### 4.2 ChatMessage Component Enhancements

**File**: `frontend/src/components/lab-conversations/ChatMessage.tsx`

Add these features:

1. **Copy to Clipboard Button**
   ```typescript
   const handleCopy = async () => {
     try {
       await navigator.clipboard.writeText(message.content)
       toast.success('Copied to clipboard')
     } catch {
       toast.error('Failed to copy')
     }
   }
   ```

2. **Message Version Selector** (if message has versions)
   ```typescript
   <DropdownMenu>
     <DropdownMenuTrigger>
       <span className="text-xs text-gray-500">
         v{message.current_version_number}/{message.versions_count}
       </span>
     </DropdownMenuTrigger>
     <DropdownMenuContent>
       {versions.map(v => (
         <DropdownMenuItem key={v.id} onClick={() => switchVersion(v.version_number)}>
           Version {v.version_number} {v.is_current && '✓'}
         </DropdownMenuItem>
       ))}
     </DropdownMenuContent>
   </DropdownMenu>
   ```

3. **Regenerate Button**
   ```typescript
   <Button
     variant="ghost"
     size="sm"
     onClick={() => setShowRegenerateDialog(true)}
   >
     <Zap className="w-4 h-4" /> Regenerate
   </Button>
   ```

### 4.3 New Component: PromptTemplates

**File**: `frontend/src/components/lab-conversations/PromptTemplates.tsx`

Create a reusable component that shows:
- List of available templates
- Search/filter by category
- Click to insert template into message input
- Option to create new template

```typescript
export function PromptTemplates({ onSelectTemplate }: { onSelectTemplate: (text: string) => void }) {
  const { templates, loadingTemplates } = useConversationStore()

  return (
    <div className="grid grid-cols-2 gap-2">
      {templates.map(template => (
        <button
          key={template.id}
          onClick={() => onSelectTemplate(template.template_text)}
          className="p-3 border rounded-lg hover:bg-gray-50"
        >
          <span className="font-medium text-sm">{template.title}</span>
          <span className="text-xs text-gray-500 block mt-1">{template.category}</span>
        </button>
      ))}
    </div>
  )
}
```

### 4.4 Enhanced ChatInput Component

**File**: `frontend/src/components/lab-conversations/ChatInput.tsx`

Add:

1. **Template Dropdown** (new section above input)
   ```typescript
   <DropdownMenu>
     <DropdownMenuTrigger>Template</DropdownMenuTrigger>
     <DropdownMenuContent>
       <PromptTemplates onSelectTemplate={insertTemplate} />
     </DropdownMenuContent>
   </DropdownMenu>
   ```

2. **Drag-Drop Zone**
   ```typescript
   const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault()
     setIsDragging(true)
   }

   const handleDrop = async (e: React.DragEvent) => {
     e.preventDefault()
     const files = Array.from(e.dataTransfer.files)
     // Handle multiple file uploads
   }
   ```

3. **Paste File Support**
   ```typescript
   useEffect(() => {
     const handlePaste = (e: ClipboardEvent) => {
       const files = e.clipboardData?.files
       if (files) {
         handleFiles(Array.from(files))
       }
     }

     window.addEventListener('paste', handlePaste)
     return () => window.removeEventListener('paste', handlePaste)
   }, [])
   ```

### 4.5 Regenerate Dialog Component

**File**: `frontend/src/components/lab-conversations/RegenerateDialog.tsx`

```typescript
export function RegenerateDialog({
  isOpen,
  onOpenChange,
  messageId,
  onRegenerate,
}: RegenerateDialogProps) {
  const [temperature, setTemperature] = useState(0.7)
  const [model, setModel] = useState<string>('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegenerate = async () => {
    setLoading(true)
    try {
      await onRegenerate({
        message_id: messageId,
        temperature: temperature !== 0.7 ? temperature : undefined,
        model: model || undefined,
        regeneration_reason: reason || undefined,
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate Response</DialogTitle>
        </DialogHeader>

        {/* Temperature slider */}
        {/* Model selector */}
        {/* Reason text area */}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRegenerate} disabled={loading}>
            {loading ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Part 5: Frontend API Client Updates

**File**: `frontend/src/lib/api/lab-conversations.ts`

Add new functions:

```typescript
// Message Regeneration
export async function regenerateMessage(
  conversationId: number,
  messageId: number,
  request: RegenerateMessageRequest,
) {
  const response = await api.post(
    `/api/v1/lab-conversations/${conversationId}/messages/${messageId}/regenerate`,
    request
  )
  return response.data as Message
}

export async function getMessageVersions(
  conversationId: number,
  messageId: number,
) {
  const response = await api.get(
    `/api/v1/lab-conversations/${conversationId}/messages/${messageId}/versions`
  )
  return response.data as MessageVersion[]
}

export async function switchMessageVersion(
  conversationId: number,
  messageId: number,
  versionNumber: number,
) {
  const response = await api.patch(
    `/api/v1/lab-conversations/${conversationId}/messages/${messageId}/switch-version`,
    { version_number: versionNumber }
  )
  return response.data as Message
}

// Prompt Templates
export async function listPromptTemplates(params?: {
  category?: string
  skip?: number
  limit?: number
}) {
  const response = await api.get('/api/v1/lab-conversations/prompt-templates', { params })
  return response.data as PromptTemplateListResponse
}

export async function createPromptTemplate(data: PromptTemplateCreate) {
  const response = await api.post('/api/v1/lab-conversations/prompt-templates', data)
  return response.data as PromptTemplate
}

export async function updatePromptTemplate(templateId: number, data: Partial<PromptTemplate>) {
  const response = await api.patch(
    `/api/v1/lab-conversations/prompt-templates/${templateId}`,
    data
  )
  return response.data as PromptTemplate
}

export async function deletePromptTemplate(templateId: number) {
  await api.delete(`/api/v1/lab-conversations/prompt-templates/${templateId}`)
}
```

---

## Part 6: Implementation Sequence (Step-by-Step)

### Phase 6.1: Database & Backend Models (4-5 hours)

1. **Create Alembic migration** for new tables:
   ```bash
   cd backend
   alembic revision --autogenerate -m "Add message versions and prompt templates"
   ```

2. **Review and adjust migration** (`backend/alembic/versions/`):
   - Ensure foreign key constraints
   - Add indexes for performance
   - Set appropriate defaults

3. **Apply migration**:
   ```bash
   alembic upgrade head
   ```

4. **Add models** to `backend/app/models/lab_conversation.py`:
   - LabMessageVersion model (15-20 lines)
   - PromptTemplate model (20-25 lines)
   - Update LabMessage model (5 new fields)

5. **Create backend services**:
   - `backend/app/services/lab_message_version_service.py` (create, get, list, update versions)
   - `backend/app/services/prompt_template_service.py` (CRUD operations)

### Phase 6.2: Backend API Endpoints (6-7 hours)

1. **Create Pydantic schemas** in `backend/app/schemas/lab_conversation.py`:
   - MessageVersionResponse
   - RegenerateMessageRequest
   - PromptTemplate schemas

2. **Implement message regeneration endpoints** (3 endpoints):
   - POST regenerate-message
   - GET message-versions
   - PATCH switch-version

3. **Implement prompt template endpoints** (4 endpoints):
   - POST create-template
   - GET list-templates
   - PATCH update-template
   - DELETE delete-template

4. **Add auto-title generation**:
   - Update stream endpoint to generate title on first message
   - Add AI service method for title generation

5. **Testing**:
   - Unit tests for each endpoint
   - Integration tests for full flow
   - API documentation (docstrings)

### Phase 6.3: Frontend State Management (2-3 hours)

1. **Update Zustand store** `useConversationStore.ts`:
   - Add version state slice
   - Add template state slice
   - Add action creators for version management
   - Add action creators for template CRUD

2. **Add hooks**:
   - `useMessageVersions(messageId)` - load versions for a message
   - `usePromptTemplates()` - load all templates
   - `useRegenerateMessage()` - handle regeneration
   - `useSwitchVersion()` - switch active version

### Phase 6.4: Frontend Components (6-7 hours)

1. **Enhance ChatMessage component**:
   - Add copy button with toast feedback
   - Add version selector dropdown (if versions exist)
   - Add regenerate button
   - Display version count badge

2. **Create PromptTemplates component**:
   - Grid layout of available templates
   - Click to insert into input
   - Category filtering
   - Create new template option

3. **Enhance ChatInput component**:
   - Add template dropdown selector
   - Implement drag-drop file upload
   - Implement paste file support
   - Add multiple file upload queue
   - Display file upload progress

4. **Create RegenerateDialog component**:
   - Temperature slider
   - Model selector
   - Reason text area
   - Loading state

5. **Create PromptTemplateManager component** (optional, for CRUD):
   - Create new template dialog
   - Edit template dialog
   - Delete confirmation

### Phase 6.5: Integration & Testing (2-3 hours)

1. **Update API client** `frontend/src/lib/api/lab-conversations.ts`:
   - Add regenerate functions
   - Add template CRUD functions
   - Add version switching functions

2. **Integration testing**:
   - Test copy button functionality
   - Test message regeneration flow
   - Test version switching
   - Test template insertion
   - Test file upload scenarios

3. **UI/UX polishing**:
   - Toast notifications
   - Loading states
   - Error handling
   - Keyboard shortcuts (optional)

### Phase 6.6: Code Review & QA (1-2 hours)

1. **Code review**:
   - Type safety check
   - Security review
   - Performance optimization
   - Documentation

2. **QA Testing**:
   - Manual testing of all features
   - Edge cases
   - Error scenarios
   - Browser compatibility

---

## Part 7: Type Definitions

Add to `frontend/src/types/api.ts`:

```typescript
interface MessageVersion {
  id: number
  message_id: number
  version_number: number
  content: string
  model_used?: string
  prompt_tokens?: number
  completion_tokens?: number
  processing_time_ms?: number
  is_current: boolean
  regeneration_reason?: string
  created_at: string
}

interface PromptTemplate {
  id: number
  doctor_id: number
  title: string
  template_text: string
  description?: string
  category?: string
  is_system: boolean
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PromptTemplateCreate {
  title: string
  template_text: string
  description?: string
  category?: string
}

interface RegenerateMessageRequest {
  message_id: number
  model?: string
  temperature?: number
  max_tokens?: number
  regeneration_reason?: string
}

// Update Message interface to include version fields
interface Message {
  // ... existing fields ...
  current_version_number: number
  has_versions: boolean
  versions_count?: number
}
```

---

## Part 8: Dependencies & Imports

### Backend
- Already have: `SQLAlchemy`, `Pydantic`, `FastAPI`, `asyncio`
- No new external dependencies needed

### Frontend
- Already have: `zustand`, `react-hot-toast`, `shadcn/ui`, `typescript`
- No new external dependencies needed

---

## Part 9: Testing Strategy

### Backend Tests

**Unit Tests** (`backend/tests/api/v1/test_lab_conversations_v1.py`):
- Test message version creation
- Test version switching
- Test template CRUD
- Test auto-title generation
- Test rate limiting

**Integration Tests**:
- Full regeneration flow
- Template insertion into message
- Version history tracking
- Database consistency

### Frontend Tests

**Component Tests** (`frontend/src/components/lab-conversations/__tests__/`):
- ChatMessage copy button
- Version selector
- RegenerateDialog
- PromptTemplates component
- Enhanced ChatInput drag-drop

---

## Part 10: Performance Considerations

1. **Database Indexing**:
   - `lab_message_versions` table indexed on message_id
   - `prompt_templates` table indexed on doctor_id, category, is_active

2. **Query Optimization**:
   - Lazy load versions (only when user clicks)
   - Cache templates in Zustand
   - Pagination for version history

3. **Frontend Optimization**:
   - Debounce template search
   - Memoize template list
   - Virtualize long template lists if needed

---

## Part 11: Deployment Checklist

Before production deployment:

- [ ] Database migrations tested on staging
- [ ] All API endpoints documented in OpenAPI/Swagger
- [ ] Rate limiting configured appropriately
- [ ] Error handling comprehensive
- [ ] Audit logging for all version changes
- [ ] Frontend type-check passes
- [ ] Backend tests pass (pytest)
- [ ] No console errors in dev tools
- [ ] Security review complete
- [ ] Performance benchmarks acceptable

---

## Part 12: Estimated Timeline

| Phase | Component | Hours | Priority |
|-------|-----------|-------|----------|
| 6.1 | Database & Models | 4-5 | Critical |
| 6.2 | Backend API | 6-7 | Critical |
| 6.3 | State Management | 2-3 | High |
| 6.4 | Frontend Components | 6-7 | High |
| 6.5 | Integration | 2-3 | High |
| 6.6 | QA & Review | 1-2 | High |
| **Total** | **All 5 Features** | **20-24** | **Required** |

**Parallel Work Possible**:
- Phases 6.1 & 6.3 can start simultaneously
- Phases 6.2 & 6.4 can start after 6.1 completes

---

## Implementation Notes

### Key Design Decisions

1. **Message Versions Table vs JSON Column**:
   - Using separate table for scalability and query flexibility
   - Supports full version history and audit trails

2. **Backend Storage vs localStorage**:
   - Backend storage required for:
     - Data persistence across browsers/devices
     - Audit trail compliance
     - Server-side backups
     - Multi-device synchronization

3. **Copy Button Implementation**:
   - Using `navigator.clipboard.writeText()` for modern browsers
   - Toast notification for user feedback
   - Fallback to manual copy on older browsers (optional)

4. **Template System**:
   - Separate system templates from user templates
   - Track usage for recommendations
   - Category-based organization

5. **Auto-Title Generation**:
   - Only on first AI message to avoid excessive API calls
   - Timeout fallback (5 seconds) to prevent blocking
   - User can edit title anytime

### Known Limitations & Future Enhancements

1. **Phase 1 Scope**:
   - Auto-title uses simple truncation approach (can be enhanced with more sophisticated NLP)
   - File upload batch processing limits to 5 files per request
   - Template library basic (can add AI-suggested templates in Phase 2)

2. **Future Phases**:
   - Keyboard shortcuts for copy/regenerate
   - Voice input for prompts
   - Template sharing between doctors
   - Advanced analytics on regeneration patterns

---

## Sign-Off

This implementation plan is comprehensive and ready for execution. All 5 Phase 1 features are designed to work together cohesively with backend database storage for persistence and audit compliance.

**Next Step**: User approval to proceed with implementation following this plan sequentially.
