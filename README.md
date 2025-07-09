# 📄 CollabDocs – Real-time Collaborative Document Editor

**CollabDocs** is a modern, real-time collaborative document editing platform where multiple users can edit, manage, and collaborate on documents simultaneously. With live cursors, session tracking, and instant syncing, it's ideal for teams, students, or anyone working on shared content.

---

## 🚀 Features

### 🧠 Core
- Real-time multi-user editing
- Live cursor tracking & user presence
- Auto-saving on pause
- Document creation, editing, and deletion
- Email-based collaborator access
- Owner-level permission system

### 💡 UX Enhancements
- Clean, modern interface
- Responsive across desktop and mobile
- Toast notifications for user actions
- Auto cleanup of inactive sessions

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Backend:** Convex (serverless functions and DB)
- **Authentication:** Email-based Convex Auth
- **Build Tool:** Vite
- **Notifications:** Sonner

---

## 🧰 Getting Started

### 🔧 Prerequisites
- Node.js v18+
- npm or yarn

### 📥 Installation

```bash
git clone https://github.com/your-username/collabdocs.git
cd collabdocs
npm install
```

### ⚙️ Start Development

```bash
npx convex dev       # Start backend
npm run dev          # Start frontend
```

App runs at `http://localhost:5173`

---

## 🗂️ Project Structure

```
├── convex/                 # Backend logic
│   ├── auth.ts
│   ├── documents.ts
│   ├── sessions.ts
│   ├── schema.ts
│   └── _generated/
├── src/
│   ├── components/
│   │   ├── DocumentEditor.tsx
│   │   ├── DocumentList.tsx
│   │   └── CollaboratorCursors.tsx
│   ├── App.tsx
│   └── main.tsx
└── public/
```

---

## 🧩 Key Components

### ✍️ DocumentEditor
Handles:
- Real-time editing
- Cursor/sync logic
- Title editing
- Collaborator session handling

### 👥 CollaboratorCursors
- Tracks live cursors
- Color-coded by user
- Highlights selection ranges

### 📃 DocumentList
- Shows all documents
- Create/Delete options
- Metadata and navigation

---

## 🗃️ Database Schema

### 📄 Documents Table
```ts
{
  title: string,
  content: string,
  ownerId: Id<"users">,
  collaborators: Id<"users">[],
  isPublic: boolean,
  lastModified: number
}
```

### 🔄 Sessions Table
```ts
{
  documentId: Id<"documents">,
  userId: Id<"users">,
  userName: string,
  cursorPosition: number,
  selection: { start: number, end: number },
  lastSeen: number
}
```

---

## 🔧 API Highlights

- `createDocument(title)`
- `listDocuments()`
- `getDocument(documentId)`
- `updateDocument(documentId, content)`
- `addCollaborator(documentId, email)`
- `updateSession(documentId, cursor, selection)`
- `getActiveSessions(documentId)`

---

## ⚙️ Deployment

### 🧠 Backend
```bash
npx convex deploy
```

### 🌐 Frontend
```bash
npm run build
```
Deploy the `/dist` folder to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

---

## 🎨 Customization

- Theme: Customize via `tailwind.config.js`
- Cursor colors defined in:
```ts
const colors = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500',
  'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-orange-500'
];
```

---

## 📄 License

This project is licensed under the MIT License.

---

> Made with 💻 and ☕ by **Aditya Yeola**
