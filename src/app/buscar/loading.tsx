export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 h-6 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
