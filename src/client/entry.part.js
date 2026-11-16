// Registration. Concatenated last, inside the module factory, so it can close over the
// components and the bundled dictionary above.

const NS = 's-eidos';

// One id addresses both halves of a global panel: the sidebar row and the page it opens.
const PANEL_ID = 's-eidos';

/**
 * @param {object} ctx client plugin context
 */
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, LOCALE), 's-eidos: locale dictionary');
  boundTranslate = ctx.locale.bind(NS);

  // The page the sidebar row opens.
  ctx.slots.inject('main', () =>
    ctx.slots.register(
      {
        name: 'main',
        key: PANEL_ID,
        locale: NS,
      },
      Page,
    ),
  );

  // The left sidebar row itself. `label` supplies the visible text, the accessible name and
  // the collapsed-rail tooltip; the icon component receives the host's size.
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 0,
        label: () => T('panel'),
        locale: NS,
      },
      PanelIcon,
    ),
  );
}

return { inject: ['slots', 'locale'], apply };
