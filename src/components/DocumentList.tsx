import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentListProps {
  onSelectDocument: (id: Id<"documents">) => void;
}

export function DocumentList({ onSelectDocument }: DocumentListProps) {
  const documents = useQuery(api.documents.listDocuments) || [];
  const createDocument = useMutation(api.documents.createDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  
  const [newDocTitle, setNewDocTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    setIsCreating(true);
    try {
      const docId = await createDocument({ title: newDocTitle.trim() });
      setNewDocTitle("");
      toast.success("Document created!");
      onSelectDocument(docId);
    } catch (error) {
      toast.error("Failed to create document");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (docId: Id<"documents">, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await deleteDocument({ documentId: docId });
      toast.success("Document deleted");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Documents</h1>
          <p className="text-gray-600">Create and manage your collaborative documents</p>
        </div>

        {/* Create new document form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={handleCreateDocument} className="flex gap-3">
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Enter document title..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={!newDocTitle.trim() || isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isCreating ? "Creating..." : "Create Document"}
            </button>
          </form>
        </div>

        {/* Documents list */}
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500">Create your first document to get started</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectDocument(doc._id)}
                  >
                    <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>Modified {formatDate(doc.lastModified)}</span>
                      {doc.collaborators.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          {doc.collaborators.length} collaborator{doc.collaborators.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {doc.isPublic && (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectDocument(doc._id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc._id, doc.title)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
