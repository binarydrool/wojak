"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#4ade80] text-black rounded font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
