// Shared snippet SELECT + shaping, used by the snippets and collections routes.
// The first bound parameter for any query using SELECT_SNIPPET must be the
// current user's id (or 0 when logged out) — it powers `liked_by_me`.
export const SELECT_SNIPPET = `
  SELECT s.*, u.username AS author,
    (SELECT COUNT(*) FROM likes l WHERE l.snippet_id = s.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.snippet_id = s.id) AS comment_count,
    (SELECT COUNT(*) FROM snippets f WHERE f.forked_from = s.id) AS fork_count,
    EXISTS(SELECT 1 FROM likes lm WHERE lm.snippet_id = s.id AND lm.user_id = ?) AS liked_by_me,
    fs.title AS forked_from_title, fu.username AS forked_from_author
  FROM snippets s
  JOIN users u ON u.id = s.user_id
  LEFT JOIN snippets fs ON fs.id = s.forked_from
  LEFT JOIN users fu ON fu.id = fs.user_id
`;

export function shapeSnippet(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    language: row.language,
    code: row.code,
    tags: row.tags ? row.tags.split(',') : [],
    downloads: row.downloads,
    author: row.author,
    authorId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    forkCount: row.fork_count ?? 0,
    likedByMe: !!row.liked_by_me,
    forkedFrom: row.forked_from
      ? { id: row.forked_from, title: row.forked_from_title, author: row.forked_from_author }
      : null,
  };
}
