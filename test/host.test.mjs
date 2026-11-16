import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { apply } from '../index.js';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * A minimal Cordis-shaped context: enough surface for `apply` to register into, and a
 * record of every effect so the test can prove they are effects rather than side effects.
 *
 * @returns {{ ctx: object, tools: object[], skills: object[], effects: string[] }}
 */
function fakeContext() {
  /** @type {object[]} */
  const tools = [];
  /** @type {object[]} */
  const skills = [];
  /** @type {string[]} */
  const effects = [];

  const ctx = {
    tools: {
      register: (tool) => {
        tools.push(tool);
        return () => {};
      },
    },
    skills: {
      register: (skill) => {
        skills.push(skill);
        return () => {};
      },
    },
    effect: (run, label) => {
      effects.push(String(label));
      const disposer = run();
      return typeof disposer === 'function' ? disposer : () => {};
    },
    get: () => undefined,
  };

  return { ctx, tools, skills, effects };
}

test('apply registers exactly one tool and one skill, as effects', async () => {
  const { ctx, tools, skills, effects } = fakeContext();
  await apply(ctx);

  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, 's_eidos_audit');
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 's-eidos-audit');
  assert.equal(effects.length, 2);
  for (const label of effects) assert.match(label, /^s-eidos/);
});

test('the skill body is real content, not a placeholder', async () => {
  const { ctx, skills } = fakeContext();
  await apply(ctx);
  const skill = skills[0];
  assert.ok(skill.content.length > 1200);
  assert.match(skill.content, /s_eidos_audit/);
  assert.match(skill.content, /never edits|does not edit/i);
  assert.equal(skill.source, 'bundled');
  assert.equal(skill.invocation.modelInvocable, true);
  assert.ok(skill.path.endsWith('SKILL.md'));
});

test('the tool schema is closed and requires explicit paths', async () => {
  const { ctx, tools } = fakeContext();
  await apply(ctx);
  const parameters = tools[0].parameters;
  assert.equal(parameters.type, 'object');
  assert.equal(parameters.additionalProperties, false);
  assert.deepEqual(parameters.required, ['paths']);
  assert.equal(parameters.properties.paths.minItems, 1);
  assert.equal(parameters.properties.paths.maxItems, 16);
  assert.deepEqual(parameters.properties.format.enum, ['summary', 'json']);
  assert.equal(typeof tools[0].execute, 'function');
  assert.equal(typeof tools[0].output.render, 'function');
});

test('the tool refuses an empty path list rather than scanning the workspace', async () => {
  const { ctx, tools } = fakeContext();
  await apply(ctx);
  const value = await tools[0].execute({ paths: [] }, { agent: { session: { header: { cwd: here } } } });
  assert.equal(value.ok, false);
  assert.equal(value.error.code, 'no-targets');
});

test('the tool reviews a workspace and returns a report value', async () => {
  const { ctx, tools } = fakeContext();
  await apply(ctx);

  const workspace = await mkdtemp(join(tmpdir(), 's-eidos-host-'));
  try {
    await writeFile(
      join(workspace, 'page.html'),
      '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"></head><body></body></html>\n',
    );

    const value = await tools[0].execute(
      { paths: ['page.html'] },
      { agent: { session: { header: { cwd: workspace } } } },
    );

    assert.equal(value.ok, true, JSON.stringify(value.error));
    assert.equal(value.report.summary.findings, 1);
    const [finding] = value.report.findings;
    assert.equal(finding.ruleId, 'MET-001');
    assert.ok(finding.evidence.url.startsWith('https://'));
    assert.ok(finding.falsePositives.length > 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('the rendered tool result is bounded and states what it omitted', async () => {
  const { ctx, tools } = fakeContext();
  await apply(ctx);
  const workspace = await mkdtemp(join(tmpdir(), 's-eidos-render-'));
  try {
    const rows = Array.from({ length: 40 }, (_, index) => `<a href="javascript:void(${index})">x</a>`).join(
      '\n',
    );
    await writeFile(join(workspace, 'many.html'), `<!doctype html><html><body>\n${rows}\n</body></html>\n`);

    const value = await tools[0].execute(
      { paths: ['many.html'], format: 'summary' },
      { agent: { session: { header: { cwd: workspace } } } },
    );
    assert.equal(value.ok, true);
    const blocks = tools[0].output.render({}, value);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, 'text');
    assert.ok(blocks[0].text.length <= 12_400);
    if (blocks[0].text.length >= 12_000) {
      assert.match(blocks[0].text, /truncated/);
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('a failure renders an actionable message, never an empty result', async () => {
  const { ctx, tools } = fakeContext();
  await apply(ctx);
  const blocks = tools[0].output.render(
    {},
    { ok: false, error: { code: 'bad-preset', message: 'unknown support preset "x"', known: ['a', 'b'] } },
  );
  assert.equal(blocks.length, 1);
  assert.match(blocks[0].text, /unknown support preset/);
  assert.match(blocks[0].text, /Known values: a, b/);
});

test('apply is inert when the profile has no tool service', async () => {
  const ctx = { effect: () => () => {} };
  await assert.doesNotReject(async () => {
    await apply(ctx);
  });
});
