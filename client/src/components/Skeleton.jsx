// Loading-state skeletons. Product UIs show the *shape* of incoming content
// instead of a spinner or "Loading…" text, so the layout doesn't jump.

export function Skeleton({ w = '100%', h = 14, r = 6, style }) {
  return <span className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function SnippetCardSkeleton() {
  return (
    <div className="card snippet-card skel-card" aria-hidden="true">
      <div className="snippet-card-head">
        <Skeleton w={68} h={20} r={999} />
        <Skeleton w={46} h={11} />
      </div>
      <Skeleton w="65%" h={18} style={{ marginTop: 2 }} />
      <Skeleton w="90%" h={12} />
      <Skeleton w="100%" h={86} r={8} style={{ marginTop: 4 }} />
      <div className="snippet-card-foot">
        <Skeleton w={64} h={11} />
        <Skeleton w={84} h={11} />
      </div>
    </div>
  );
}

// A grid of placeholder cards, matching the real snippet grid's shape.
export function SnippetGridSkeleton({ count = 6 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading snippets">
      {Array.from({ length: count }).map((_, i) => (
        <SnippetCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Placeholder for a single snippet's detail view.
export function SnippetDetailSkeleton() {
  return (
    <div className="detail" aria-busy="true" aria-label="Loading snippet">
      <Skeleton w={120} h={12} style={{ marginBottom: 18 }} />
      <Skeleton w="55%" h={34} r={8} />
      <Skeleton w={220} h={14} style={{ marginTop: 14 }} />
      <Skeleton w="80%" h={14} style={{ marginTop: 16 }} />
      <Skeleton w="100%" h={300} r={12} style={{ marginTop: 20 }} />
    </div>
  );
}
