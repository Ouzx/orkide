-- Fixture content for the local end-to-end and Lighthouse runs (`pnpm e2e:prepare`).
-- Idempotent: safe to apply to a database that already holds these rows.
INSERT OR IGNORE INTO category (id, position) VALUES ('0192f000-0000-7000-8000-000000000001', 0);

INSERT OR IGNORE INTO category_translation (category_id, locale, slug, name) VALUES
  ('0192f000-0000-7000-8000-000000000001', 'en', 'engineering', 'Engineering'),
  ('0192f000-0000-7000-8000-000000000001', 'tr', 'muhendislik', 'Mühendislik');

INSERT OR IGNORE INTO post (id, category_id, status, published_at) VALUES
  ('0192f000-0000-7000-8000-000000000101', '0192f000-0000-7000-8000-000000000001', 'published', 1790000000000);

INSERT OR IGNORE INTO post_translation (post_id, locale, slug, title, summary, content, html, markdown, reading_time_minutes) VALUES
  (
    '0192f000-0000-7000-8000-000000000101', 'en', 'edge-first-architecture',
    'Edge-first architecture on Workers',
    'Why a blog runs as two Workers joined by a Service Binding, and what it buys.',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Two Workers, one origin"}]},{"type":"paragraph","content":[{"type":"text","text":"The web Worker forwards API calls "},{"type":"text","marks":[{"type":"bold"}],"text":"in-process"},{"type":"text","text":" through a Service Binding."}]}]}',
    '<h2>Two Workers, one origin</h2><p>The web Worker forwards API calls <strong>in-process</strong> through a Service Binding.</p>',
    '## Two Workers, one origin' || char(10) || char(10) || 'The web Worker forwards API calls **in-process** through a Service Binding.',
    1
  ),
  (
    '0192f000-0000-7000-8000-000000000101', 'tr', 'uc-oncelikli-mimari',
    'Workers üzerinde uç öncelikli mimari',
    'Bir blog neden bir Service Binding ile bağlı iki Worker olarak çalışır?',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"İki Worker, tek köken"}]},{"type":"paragraph","content":[{"type":"text","text":"Web Worker, API çağrılarını Service Binding üzerinden süreç içinde iletir."}]}]}',
    '<h2>İki Worker, tek köken</h2><p>Web Worker, API çağrılarını Service Binding üzerinden süreç içinde iletir.</p>',
    '## İki Worker, tek köken' || char(10) || char(10) || 'Web Worker, API çağrılarını Service Binding üzerinden süreç içinde iletir.',
    1
  );
