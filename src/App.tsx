import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { DocumentList } from "./components/DocumentList";
import { DocumentEditor } from "./components/DocumentEditor";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">CollabDocs</h2>
          <h3 className="text-l font-semibold text-primary">By Aditya Yeola</h3>
          {selectedDocumentId && (
            <button
              onClick={() => setSelectedDocumentId(null)}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100"
            >
              ← Back to Documents
            </button>
          )}
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 flex">
        <Content 
          selectedDocumentId={selectedDocumentId}
          setSelectedDocumentId={setSelectedDocumentId}
        />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ 
  selectedDocumentId, 
  setSelectedDocumentId 
}: {
  selectedDocumentId: Id<"documents"> | null;
  setSelectedDocumentId: (id: Id<"documents"> | null) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <div className="flex-1 flex">
          {selectedDocumentId ? (
            <DocumentEditor 
              documentId={selectedDocumentId}
              onBack={() => setSelectedDocumentId(null)}
            />
          ) : (
            <DocumentList onSelectDocument={setSelectedDocumentId} />
          )}
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-primary mb-4">CollabDocs</h1>
              <p className="text-xl text-secondary">Real-time collaborative document editing</p>
              <p className="text-lg text-gray-600 mt-2">Sign in to get started</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
