import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import InboxPage from "./pages/InboxPage";

function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-gray-900 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
        <span className="mr-4 text-lg font-semibold text-gray-900">
          Triage
        </span>
        <NavLink to="/upload" className={linkClass}>
          Upload
        </NavLink>
        <NavLink to="/inbox" className={linkClass}>
          Inbox
        </NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="mx-auto max-w-6xl">
        <Routes>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Not found</h1>
      <p className="mt-2 text-gray-600">That page doesn't exist.</p>
    </div>
  );
}