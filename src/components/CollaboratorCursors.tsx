import { useEffect, useState } from "react";

interface Session {
  _id: string;
  userName: string;
  cursorPosition: number;
  selection: {
    start: number;
    end: number;
  };
}

interface CollaboratorCursorsProps {
  sessions: Session[];
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function CollaboratorCursors({ sessions, content, textareaRef }: CollaboratorCursorsProps) {
  const [cursorPositions, setCursorPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight);
    const fontSize = parseInt(computedStyle.fontSize);
    const paddingLeft = parseInt(computedStyle.paddingLeft);
    const paddingTop = parseInt(computedStyle.paddingTop);

    const newPositions: Record<string, { x: number; y: number }> = {};

    sessions.forEach((session) => {
      const position = Math.min(session.cursorPosition, content.length);
      const textBeforeCursor = content.substring(0, position);
      const lines = textBeforeCursor.split('\n');
      const lineNumber = lines.length - 1;
      const columnNumber = lines[lines.length - 1].length;

      // Approximate character width (this is a rough estimate)
      const charWidth = fontSize * 0.6;

      const x = paddingLeft + (columnNumber * charWidth);
      const y = paddingTop + (lineNumber * lineHeight);

      newPositions[session._id] = { x, y };
    });

    setCursorPositions(newPositions);
  }, [sessions, content, textareaRef]);

  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {sessions.map((session, index) => {
        const position = cursorPositions[session._id];
        if (!position) return null;

        const colorClass = colors[index % colors.length];

        return (
          <div key={session._id}>
            {/* Cursor line */}
            <div
              className={`absolute w-0.5 h-6 ${colorClass} animate-pulse`}
              style={{
                left: position.x,
                top: position.y,
              }}
            />
            
            {/* User name label */}
            <div
              className={`absolute ${colorClass} text-white text-xs px-2 py-1 rounded-md whitespace-nowrap`}
              style={{
                left: position.x,
                top: position.y - 30,
              }}
            >
              {session.userName}
            </div>

            {/* Selection highlight */}
            {session.selection.start !== session.selection.end && (
              <div
                className={`absolute ${colorClass.replace('bg-', 'bg-opacity-20 bg-')} pointer-events-none`}
                style={{
                  left: position.x,
                  top: position.y,
                  width: Math.abs(session.selection.end - session.selection.start) * 12, // Approximate
                  height: 24,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
