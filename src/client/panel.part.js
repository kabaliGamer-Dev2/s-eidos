// Panel components. This file is concatenated into the built client.js, so it has no
// imports: `React`, `h`, `CATALOG`, `LOCALE` and the model helpers are already in scope.

// Bound by `apply` once the host's locale service is available; until then the bundled
// dictionary is authoritative, so the panel never renders a raw key.
let boundTranslate = null;

const T = (key) => {
  if (boundTranslate !== null) {
    const translated = boundTranslate(key);
    if (typeof translated === 'string' && translated !== key) return translated;
  }
  return typeof LOCALE[key] === 'string' ? LOCALE[key] : key;
};

const S = {
  page: {
    height: '100%',
    overflowY: 'auto',
    padding: '20px 24px 32px',
    color: 'var(--dsw-alias-label-primary)',
    background: 'var(--dsw-alias-bg-base)',
    font: 'inherit',
  },
  header: { display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' },
  title: { margin: 0, fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em' },
  subtitle: {
    margin: '6px 0 0',
    color: 'var(--dsw-alias-label-secondary)',
    fontSize: '13px',
    lineHeight: 1.5,
    maxWidth: '72ch',
  },
  meta: {
    marginTop: '12px',
    color: 'var(--dsw-alias-label-secondary)',
    fontSize: '12px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  toolbar: { display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap', alignItems: 'center' },
  input: {
    flex: '1 1 220px',
    minWidth: '160px',
    padding: '7px 10px',
    fontSize: '13px',
    color: 'var(--dsw-alias-label-primary)',
    background: 'var(--dsw-alias-bg-layer-1)',
    border: '1px solid var(--dsw-alias-border-l1)',
    borderRadius: '8px',
    font: 'inherit',
  },
  select: {
    padding: '7px 10px',
    fontSize: '13px',
    color: 'var(--dsw-alias-label-primary)',
    background: 'var(--dsw-alias-bg-layer-1)',
    border: '1px solid var(--dsw-alias-border-l1)',
    borderRadius: '8px',
    font: 'inherit',
  },
  button: {
    padding: '7px 12px',
    fontSize: '13px',
    font: 'inherit',
    cursor: 'pointer',
    color: 'var(--dsw-alias-label-primary)',
    background: 'var(--dsw-alias-bg-layer-2)',
    border: '1px solid var(--dsw-alias-border-l1)',
    borderRadius: '8px',
  },
  list: {
    listStyle: 'none',
    margin: '16px 0 0',
    padding: 0,
    borderTop: '1px solid var(--dsw-alias-border-l1)',
  },
  row: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '11px 4px',
    font: 'inherit',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--dsw-alias-border-l1)',
    color: 'var(--dsw-alias-label-primary)',
    cursor: 'pointer',
  },
  rowHead: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' },
  id: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '12px',
    color: 'var(--dsw-alias-label-secondary)',
  },
  rowTitle: { fontSize: '13px', fontWeight: 500 },
  badge: {
    fontSize: '11px',
    padding: '1px 6px',
    borderRadius: '999px',
    border: '1px solid var(--dsw-alias-border-l2)',
  },
  empty: { marginTop: '24px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' },
  section: { marginTop: '18px' },
  sectionTitle: {
    margin: '0 0 6px',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--dsw-alias-label-secondary)',
  },
  body: { margin: 0, fontSize: '13px', lineHeight: 1.55 },
  factGrid: {
    display: 'grid',
    gridTemplateColumns: 'max-content 1fr',
    gap: '4px 16px',
    marginTop: '14px',
    fontSize: '12.5px',
  },
  factLabel: { color: 'var(--dsw-alias-label-secondary)' },
  code: {
    margin: '6px 0 0',
    padding: '10px 12px',
    fontSize: '12px',
    lineHeight: 1.5,
    overflowX: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: 'var(--dsw-alias-bg-layer-2)',
    border: '1px solid var(--dsw-alias-border-l1)',
    borderRadius: '8px',
  },
  link: { color: 'var(--dsw-alias-brand-primary)', textDecoration: 'none', wordBreak: 'break-word' },
  caption: {
    marginTop: '22px',
    paddingTop: '12px',
    borderTop: '1px solid var(--dsw-alias-border-l1)',
    fontSize: '12px',
    lineHeight: 1.5,
    color: 'var(--dsw-alias-label-secondary)',
  },
  back: { marginBottom: '14px' },
};

/** The sidebar glyph: a patina ring with the age it is measuring marked inside it. */
function PanelIcon({ size }) {
  const edge = typeof size === 'number' && size > 0 ? size : 20;
  return h(
    'svg',
    {
      width: edge,
      height: edge,
      viewBox: '0 0 36 36',
      fill: 'none',
      'aria-hidden': true,
      focusable: 'false',
    },
    h('circle', { cx: 18, cy: 18, r: 13.5, stroke: 'currentColor', strokeWidth: 2.2, opacity: 0.9 }),
    h('path', {
      d: 'M18 8.5a9.5 9.5 0 0 1 0 19',
      stroke: 'currentColor',
      strokeWidth: 2.2,
      strokeLinecap: 'round',
      opacity: 0.55,
    }),
    h('circle', { cx: 18, cy: 18, r: 3.2, fill: 'currentColor' }),
    h('circle', { cx: 18, cy: 4.6, r: 1.7, fill: 'currentColor', opacity: 0.7 }),
  );
}

function Badge({ children, token }) {
  return h(
    'span',
    {
      style: { ...S.badge, color: `var(${token})`, borderColor: `var(${token})` },
    },
    children,
  );
}

function RuleRow({ rule, onOpen }) {
  const style = classificationStyle(rule.classification);
  return h(
    'li',
    null,
    h(
      'button',
      {
        type: 'button',
        onClick: () => onOpen(rule.id),
        style: S.row,
        'aria-label': `${rule.id} ${rule.title} — ${rule.classification}, ${rule.severity}`,
      },
      h(
        'div',
        { style: S.rowHead },
        h('span', { style: { ...S.id, color: `var(${style.token})` }, 'aria-hidden': true }, style.mark),
        h('span', { style: S.id }, rule.id),
        h('span', { style: S.rowTitle }, rule.title),
        h(Badge, { token: style.token }, style.label),
        h('span', { style: { ...S.id, marginLeft: 'auto' } }, rule.severity),
      ),
    ),
  );
}

function Migration({ rule }) {
  return h(
    'div',
    { style: S.section },
    h('h3', { style: S.sectionTitle }, T('migration')),
    h(
      'pre',
      { style: S.code },
      `${T('before')}:\n${rule.migration.before}\n\n${T('after')}:\n${rule.migration.after}`,
    ),
    rule.migration.notes === undefined
      ? null
      : h(
          'p',
          { style: { ...S.body, marginTop: '6px', color: 'var(--dsw-alias-label-secondary)' } },
          rule.migration.notes,
        ),
  );
}

function RuleDetail({ rule, onBack, onCopy, copied }) {
  const facts = ruleFacts(rule, T);
  const stale = isStale(rule);

  return h(
    'div',
    null,
    h(
      'button',
      { type: 'button', onClick: onBack, style: { ...S.button, ...S.back } },
      `\u2190 ${T('backToList')}`,
    ),

    h(
      'div',
      { style: S.header },
      h('span', { style: { ...S.id, fontSize: '13px' } }, rule.id),
      h('h2', { style: { ...S.title, fontSize: '16px' } }, rule.title),
      h(Badge, { token: classificationStyle(rule.classification).token }, rule.classification),
      stale ? h(Badge, { token: '--dsw-alias-state-warn-primary' }, T('staleRules')) : null,
    ),

    h('p', { style: { ...S.subtitle, marginTop: '10px' } }, rule.why),

    h(
      'dl',
      { style: S.factGrid },
      facts.flatMap((fact) => [
        h('dt', { key: `${fact.key}-l`, style: S.factLabel }, fact.label),
        h('dd', { key: `${fact.key}-v`, style: { margin: 0 } }, fact.value),
      ]),
    ),

    h(
      'div',
      { style: S.section },
      h('h3', { style: S.sectionTitle }, T('detectionHint')),
      h('p', { style: S.body }, rule.detectionHint),
    ),

    h(
      'div',
      { style: S.section },
      h('h3', { style: S.sectionTitle }, T('falsePositives')),
      h(
        'ul',
        { style: { ...S.body, paddingLeft: '18px', margin: 0 } },
        rule.falsePositives.map((condition, index) =>
          h('li', { key: index, style: { marginBottom: '4px' } }, condition),
        ),
      ),
    ),

    h(Migration, { rule }),

    h(
      'div',
      { style: S.section },
      h('h3', { style: S.sectionTitle }, T('evidence')),
      h(
        'p',
        { style: S.body },
        h(
          'a',
          { href: rule.evidence.url, target: '_blank', rel: 'noreferrer noopener', style: S.link },
          rule.evidence.title,
        ),
        h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, ` — ${rule.evidence.authority}`),
      ),
      h(
        'p',
        {
          style: { ...S.body, marginTop: '4px', color: 'var(--dsw-alias-label-secondary)', fontSize: '12px' },
        },
        `${T('retrieved')} ${rule.evidence.retrieved} · ${T('reviewBy')} ${rule.evidence.reviewBy}`,
      ),
    ),

    rule.standards !== undefined && rule.standards.length > 0
      ? h(
          'div',
          { style: S.section },
          h('h3', { style: S.sectionTitle }, T('standards')),
          h(
            'p',
            { style: S.body },
            rule.standards.map((entry) => `${entry.framework} ${entry.id}`).join(' · '),
          ),
        )
      : null,

    h(
      'div',
      { style: S.section },
      h('h3', { style: S.sectionTitle }, T('copyCommand')),
      h('pre', { style: S.code }, commandFor(rule.id)),
      h(
        'div',
        { style: { ...S.toolbar, marginTop: '8px' } },
        h(
          'button',
          { type: 'button', style: S.button, onClick: () => onCopy(commandFor(rule.id)) },
          copied === commandFor(rule.id) ? T('copied') : T('copyCommand'),
        ),
        h(
          'button',
          { type: 'button', style: S.button, onClick: () => onCopy(toolCallFor(rule.id)) },
          copied === toolCallFor(rule.id) ? T('copied') : T('copyToolCall'),
        ),
      ),
    ),
  );
}

function Page() {
  const [selected, setSelected] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [classification, setClassification] = React.useState('');
  const [severity, setSeverity] = React.useState('');
  const [copied, setCopied] = React.useState('');

  const summary = catalogSummary(CATALOG);
  const rules = filterRules(CATALOG, { query, classification, severity });
  const rule = selected === null ? undefined : CATALOG.rules.find((entry) => entry.id === selected);

  const copy = (text) => {
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (clipboard === undefined || typeof clipboard.writeText !== 'function') return;
    void clipboard
      .writeText(text)
      .then(() => setCopied(text))
      .catch(() => {});
  };

  return h(
    'div',
    { style: S.page },
    h('div', { style: S.header }, h('h1', { style: S.title }, T('title'))),
    h('p', { style: S.subtitle }, T('subtitle')),
    h(
      'div',
      { style: S.meta },
      h('span', null, `${T('catalogVersion')} ${summary.version} · ${summary.asOf}`),
      h('span', null, `${summary.rules} ${T('rules')}`),
      summary.stale > 0
        ? h(
            'span',
            { style: { color: 'var(--dsw-alias-state-warn-primary)' } },
            `${summary.stale} ${T('staleRules')}`,
          )
        : null,
    ),

    rule === undefined
      ? h(
          'div',
          null,
          h(
            'div',
            { style: S.toolbar },
            h('input', {
              type: 'search',
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: T('searchPlaceholder'),
              'aria-label': T('searchPlaceholder'),
              style: S.input,
            }),
            h(
              'select',
              {
                value: classification,
                onChange: (event) => setClassification(event.target.value),
                'aria-label': T('allClassifications'),
                style: S.select,
              },
              h('option', { value: '' }, T('allClassifications')),
              CLASSIFICATION_ORDER.map((value) => h('option', { key: value, value }, value)),
            ),
            h(
              'select',
              {
                value: severity,
                onChange: (event) => setSeverity(event.target.value),
                'aria-label': T('allSeverities'),
                style: S.select,
              },
              h('option', { value: '' }, T('allSeverities')),
              SEVERITY_ORDER.map((value) => h('option', { key: value, value }, value)),
            ),
          ),
          rules.length === 0
            ? h('p', { style: S.empty }, T('noMatches'))
            : h(
                'ul',
                { style: S.list },
                rules.map((entry) => h(RuleRow, { key: entry.id, rule: entry, onOpen: setSelected })),
              ),
        )
      : h(RuleDetail, { rule, onBack: () => setSelected(null), onCopy: copy, copied }),

    h('p', { style: S.caption }, T('limitation')),
  );
}
