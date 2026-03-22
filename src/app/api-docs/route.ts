export function GET() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Documentation | Draftmark</title>
  <meta name="description" content="Draftmark REST API reference — OpenAPI 3.1 specification" />
  <style>
    body { margin: 0; padding: 0; }
    body.dark { background: #0d0d0d; color: #e8e6e1; }
    body.light { background: #fafaf8; color: #1a1a1a; }

    #theme-toggle {
      position: fixed; top: 12px; right: 16px; z-index: 1000;
      background: none; border: 1px solid; border-radius: 6px;
      width: 34px; height: 34px; font-size: 16px;
      cursor: pointer; line-height: 1;
    }
    body.dark #theme-toggle { border-color: #242424; color: #8a8a8a; }
    body.dark #theme-toggle:hover { color: #e8e6e1; border-color: #444; }
    body.light #theme-toggle { border-color: #ddd9d0; color: #6b6b6b; }
    body.light #theme-toggle:hover { color: #1a1a1a; border-color: #bbb; }

    /* ── Dark overrides ── */
    body.dark .redoc-wrap { background: #0d0d0d !important; }
    body.dark .redoc-wrap > div > div { background: #0d0d0d !important; }

    /* Tables */
    body.dark table { border-color: #242424 !important; }
    body.dark table th { background: #141414 !important; color: #8a8a8a !important; border-color: #242424 !important; }
    body.dark table td { background: #0d0d0d !important; color: #e8e6e1 !important; border-color: #242424 !important; }
    body.dark table tr:nth-child(2n) td { background: #111 !important; }

    /* Schema property rows, field descriptions, content area */
    body.dark [kind="field"] { background: #0d0d0d !important; }
    body.dark div[class*="property"] { border-color: #1e1e1e !important; }
    body.dark tr[class*="row"] { background: #0d0d0d !important; }
    body.dark ul > li { border-color: #1e1e1e !important; }
    body.dark div[class*="cell"] { background: transparent !important; }

    /* Catch-all: any white backgrounds inside the main content */
    body.dark .redoc-wrap div[style*="background"] { background-color: #0d0d0d !important; }
    body.dark .redoc-wrap [data-role="redoc-description"] { color: #e8e6e1 !important; }

    /* Tabs (Payload, response codes) */
    body.dark [role="tab"] { background: #141414 !important; color: #8a8a8a !important; border-color: #242424 !important; }
    body.dark [role="tab"][aria-selected="true"] { background: #1a1a1a !important; color: #e8e6e1 !important; border-color: #c8b89a !important; }
    body.dark li[role="tab"] { background: #141414 !important; border-color: #242424 !important; }
    body.dark li[role="tab"].react-tabs__tab--selected { background: #1a1a1a !important; color: #e8e6e1 !important; }
    body.dark ul[role="tablist"] { border-color: #242424 !important; }

    /* Badges, pills, enum values, constraints */
    body.dark span[class*="enum"] { background: #1a1a1a !important; color: #c8b89a !important; border-color: #333 !important; }
    body.dark span[class*="constraint"] { background: #1a1a1a !important; color: #8a8a8a !important; }
    body.dark div[class*="schema"] span { border-color: #333 !important; }

    /* Operation method badges */
    body.dark div[class*="operation"] { background: transparent !important; }

    /* Expand/collapse buttons, misc controls */
    body.dark button[class*="expand"] { color: #8a8a8a !important; }
    body.dark button:not(#theme-toggle) { border-color: #333 !important; }

    /* Request/response section labels, auth labels, content-type */
    body.dark h5 { color: #8a8a8a !important; }
    body.dark h3 { color: #e8e6e1 !important; }
    body.dark [class*="header"] { border-color: #242424 !important; }
    body.dark [class*="auth"] { color: #8a8a8a !important; }
    body.dark [class*="security"] { color: #8a8a8a !important; }
    body.dark [class*="body-schema"] span { color: #8a8a8a !important; }
    body.dark span[class*="type"] { color: #8a8a8a !important; }
    body.dark span[class*="label"] { color: #8a8a8a !important; }
    body.dark [class*="req-"] { color: #8a8a8a !important; }
    body.dark [class*="params"] { color: #8a8a8a !important; }

    /* Code blocks in descriptions */
    body.dark pre { background: #1a1a1a !important; color: #e8e6e1 !important; border-color: #242424 !important; }
    body.dark pre code { background: transparent !important; color: #e8e6e1 !important; }
    body.dark code { background: #1a1a1a !important; color: #e8e6e1 !important; }
    body.dark [class*="markdown"] pre { background: #1a1a1a !important; }

    /* Borders and dividers */
    body.dark hr { border-color: #242424 !important; }

    /* ── Light overrides ── */
    body.light .redoc-wrap { background: #fafaf8 !important; }
    body.light .redoc-wrap > div > div { background: #fafaf8 !important; }

    body.light table { border-color: #ddd9d0 !important; }
    body.light table th { background: #f0efec !important; color: #6b6b6b !important; border-color: #ddd9d0 !important; }
    body.light table td { background: #fafaf8 !important; color: #1a1a1a !important; border-color: #ddd9d0 !important; }
    body.light table tr:nth-child(2n) td { background: #f5f4f1 !important; }

    body.light [role="tab"] { background: #f0efec !important; color: #6b6b6b !important; border-color: #ddd9d0 !important; }
    body.light [role="tab"][aria-selected="true"] { background: #fafaf8 !important; color: #1a1a1a !important; border-color: #8a7a5a !important; }
    body.light li[role="tab"] { background: #f0efec !important; border-color: #ddd9d0 !important; }
    body.light li[role="tab"].react-tabs__tab--selected { background: #fafaf8 !important; color: #1a1a1a !important; }
    body.light ul[role="tablist"] { border-color: #ddd9d0 !important; }

    body.light span[class*="enum"] { background: #f0efec !important; color: #8a7a5a !important; border-color: #ddd9d0 !important; }
    body.light span[class*="constraint"] { background: #f0efec !important; color: #6b6b6b !important; }
    body.light hr { border-color: #ddd9d0 !important; }

    /* Code blocks in descriptions */
    body.light pre,
    body.light pre *,
    body.light [class*="markdown"] pre,
    body.light [class*="markdown"] > div,
    body.light [class*="highlight"],
    body.light [class*="code-block"],
    body.light [data-role="redoc-description"] pre,
    body.light [data-role="redoc-description"] > div {
      box-shadow: none !important;
      -webkit-box-shadow: none !important;
      outline: none !important;
      text-shadow: none !important;
    }
    body.light pre { background: #f0efec !important; color: #1a1a1a !important; border: 1px solid #ddd9d0 !important; }
    body.dark pre,
    body.dark [class*="markdown"] pre,
    body.dark [data-role="redoc-description"] pre {
      box-shadow: none !important;
      -webkit-box-shadow: none !important;
    }
    body.light pre code { background: transparent !important; color: #1a1a1a !important; }
    body.light code { background: #f0efec !important; color: #1a1a1a !important; }
    body.light pre .token.property,
    body.light pre .token.key,
    body.light pre .token.attr-name { color: #4a7a9a !important; }
    body.light pre .token.string,
    body.light pre .token.attr-value,
    body.light pre .token.value { color: #2e7d32 !important; }
    body.light pre .token.number { color: #b05050 !important; }
    body.light pre .token.punctuation { color: #333 !important; }
    body.light pre .token.boolean { color: #8a7a5a !important; }
    body.light pre span { color: #1a1a1a !important; }
    body.light pre .hljs-attr { color: #4a7a9a !important; }
    body.light pre .hljs-string { color: #2e7d32 !important; }
    body.light pre .hljs-number { color: #b05050 !important; }
    body.light pre .hljs-literal { color: #8a7a5a !important; }

    /* Right panel tabs — dark panel needs dark tabs */
    body.light [role="tab"] { background: #1e2a30 !important; color: #ccc !important; border-color: #37474f !important; }
    body.light [role="tab"][aria-selected="true"] { background: #263238 !important; color: #fff !important; border-bottom-color: #8a7a5a !important; }
    body.light li[role="tab"] { background: #1e2a30 !important; color: #ccc !important; border-color: #37474f !important; }
    body.light li[role="tab"].react-tabs__tab--selected { background: #263238 !important; color: #fff !important; }
    body.light ul[role="tablist"] { border-color: #37474f !important; }

    /* ── Scrollbars ── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    body.dark ::-webkit-scrollbar-track { background: #0d0d0d; }
    body.dark ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    body.light ::-webkit-scrollbar-track { background: #fafaf8; }
    body.light ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
  </style>
</head>
<body>
  <button id="theme-toggle" aria-label="Toggle theme"></button>
  <div id="redoc-container"></div>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    var themes = {
      dark: {
        colors: {
          primary: { main: '#c8b89a' },
          success: { main: '#4a7c59' },
          error: { main: '#c47a7a' },
          text: { primary: '#e8e6e1', secondary: '#8a8a8a' },
          http: { get: '#8ab4d4', post: '#4a7c59', patch: '#c8b89a', delete: '#c47a7a' },
        },
        typography: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          headings: { fontFamily: 'system-ui, -apple-system, sans-serif' },
          code: { fontFamily: 'ui-monospace, SFMono-Regular, monospace', backgroundColor: '#1a1a1a', color: '#e8e6e1' },
          links: { color: '#c8b89a' },
        },
        sidebar: {
          backgroundColor: '#0d0d0d',
          textColor: '#8a8a8a',
          activeTextColor: '#e8e6e1',
          groupItems: { activeBackgroundColor: '#141414', activeTextColor: '#e8e6e1' },
        },
        rightPanel: { backgroundColor: '#111111' },
        schema: { nestedBackground: '#141414', typeNameColor: '#8ab4d4' },
      },
      light: {
        colors: {
          primary: { main: '#8a7a5a' },
          success: { main: '#3a7050' },
          error: { main: '#b05050' },
          text: { primary: '#1a1a1a', secondary: '#6b6b6b' },
          http: { get: '#4a7a9a', post: '#3a7050', patch: '#8a7a5a', delete: '#b05050' },
        },
        typography: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          headings: { fontFamily: 'system-ui, -apple-system, sans-serif' },
          code: { fontFamily: 'ui-monospace, SFMono-Regular, monospace', backgroundColor: '#f0efec', color: '#1a1a1a' },
          links: { color: '#8a7a5a' },
        },
        sidebar: {
          backgroundColor: '#fafaf8',
          textColor: '#6b6b6b',
          activeTextColor: '#1a1a1a',
          groupItems: { activeBackgroundColor: '#f0efec', activeTextColor: '#1a1a1a' },
        },
        rightPanel: { backgroundColor: '#263238', textColor: '#e8e6e1' },
        schema: { nestedBackground: '#f5f4f1', typeNameColor: '#4a7a9a' },
      },
    };

    function getTheme() {
      try { return localStorage.getItem('theme') || 'dark'; } catch(e) { return 'dark'; }
    }

    function renderRedoc(mode) {
      document.body.className = mode;
      document.getElementById('theme-toggle').textContent = mode === 'dark' ? '\\u2600' : '\\u263E';
      var container = document.getElementById('redoc-container');
      container.innerHTML = '';
      Redoc.init('/openapi.yaml', {
        theme: themes[mode],
        hideDownloadButton: false,
        expandResponses: '200,201',
        sortPropsAlphabetically: false,
        pathInMiddlePanel: true,
      }, container);
    }

    function initRedoc() {
      if (window.Redoc) {
        renderRedoc(getTheme());
      } else {
        setTimeout(initRedoc, 100);
      }
    }

    document.getElementById('theme-toggle').addEventListener('click', function() {
      var next = getTheme() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch(e) {}
      renderRedoc(next);
    });

    initRedoc();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
