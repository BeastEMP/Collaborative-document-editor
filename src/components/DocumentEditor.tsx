import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CollaboratorCursors } from "./CollaboratorCursors";

interface DocumentEditorProps {
  documentId: Id<"documents">;
  onBack: () => void;
}

export function DocumentEditor({ documentId, onBack }: DocumentEditorProps) {
  const document = useQuery(api.documents.getDocument, { documentId });
  const activeSessions = useQuery(api.sessions.getActiveSessions, 
    document ? { documentId } : "skip"
  ) || [];
  const updateDocument = useMutation(api.documents.updateDocument);
  const updateDocumentTitle = useMutation(api.documents.updateDocumentTitle);
  const updateSession = useMutation(api.sessions.updateSession);
  const leaveSession = useMutation(api.sessions.leaveSession);
  const addCollaborator = useMutation(api.documents.addCollaborator);

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize content and title when document loads
  useEffect(() => {
    if (document) {
      setContent(document.content);
      setTitle(document.title);
    }
  }, [document]);

  // Auto-save content changes
  useEffect(() => {
    if (!document || content === document.content) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateDocument({ documentId, content });
      } catch (error) {
        toast.error("Failed to save document");
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, document, documentId, updateDocument]);

  // Update session with cursor position
  useEffect(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    sessionTimeoutRef.current = setTimeout(async () => {
      try {
        await updateSession({
          documentId,
          cursorPosition,
          selection,
        });
      } catch (error) {
        // Silently fail for session updates
      }
    }, 500);

    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [cursorPosition, selection, documentId, updateSession]);

  // Leave session on unmount
  useEffect(() => {
    return () => {
      leaveSession({ documentId });
    };
  }, [documentId, leaveSession]);

  // Handle access denied - redirect back to document list
  useEffect(() => {
    if (document === null) {
      toast.error("Access denied or document not found");
      onBack();
    }
  }, [document, onBack]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPosition(e.target.selectionStart);
    setSelection({
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    });
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
      setSelection({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      });
    }
  };

  const handleTitleSave = async () => {
    if (!title.trim() || title === document?.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateDocumentTitle({ documentId, title: title.trim() });
      setIsEditingTitle(false);
      toast.success("Title updated");
    } catch (error) {
      toast.error("Failed to update title");
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratorEmail.trim()) return;

    try {
      await addCollaborator({ 
        documentId, 
        collaboratorEmail: collaboratorEmail.trim() 
      });
      setCollaboratorEmail("");
      setShowAddCollaborator(false);
      toast.success("Collaborator added");
    } catch (error) {
      toast.error("Failed to add collaborator");
    }
  };

  // Handle loading and error states
  if (document === undefined) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <p className="text-gray-600 mb-4">This document may have been deleted or you don't have access to it.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Document header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitle(document.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <h1 
                className="text-2xl font-bold cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditingTitle(true)}
              >
                {document.title}
              </h1>
            )}
            
            {/* Active collaborators indicator */}
            {activeSessions.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex -space-x-2">
                  {activeSessions.slice(0, 3).map((session, index) => (
                    <div
                      key={session._id}
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                      title={session.userName}
                    >
                      {session.userName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {activeSessions.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                      +{activeSessions.length - 3}
                    </div>
                  )}
                </div>
                <span>{activeSessions.length} online</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCollaborator(!showAddCollaborator)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Share
            </button>
          </div>
        </div>

        {/* Add collaborator form */}
        {showAddCollaborator && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <form onSubmit={handleAddCollaborator} className="flex gap-2">
              <input
                type="email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                placeholder="Enter collaborator's email..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddCollaborator(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <CollaboratorCursors 
          sessions={activeSessions}
          content={content}
          textareaRef={textareaRef}
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          placeholder="Start writing your document..."
          className="w-full h-full p-6 resize-none focus:outline-none text-lg leading-relaxed font-mono"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
        />
      </div>

      {/* Status bar */}
      <div className="bg-gray-50 border-t px-6 py-2 text-sm text-gray-600 flex justify-between items-center">
        <div>
          {content.length} characters • {content.split('\n').length} lines
        </div>
        <div>
          Last saved: {new Date(document.lastModified).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
