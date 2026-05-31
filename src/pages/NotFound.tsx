import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-gray-400 mb-6">Page not found</p>
      <Link
        to="/"
        className="inline-block px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600"
      >
        Back to Home
      </Link>
    </div>
  );
}
