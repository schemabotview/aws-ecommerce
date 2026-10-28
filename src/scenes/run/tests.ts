import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { runTree } from './files'
import code from '../../../spine/run/02-tests/project/tests/conftest.py?raw'
import session from '../../../spine/run/02-tests/session.txt?raw'

// §6.2 — tests that do not need AWS. moto's mock_aws patches boto3 in the test process itself: the
// fixture removes the emulator's endpoint and sets fake keys, so a call that escaped the mock would
// fail rather than reach anything. Five tests: two on catalog.py, three through the HTTP server.
export const runTests: SceneModel = ideFrame({
  tree: runTree(2, { active: 'tests/conftest.py', fresh: ['tests/conftest.py', 'tests/test_catalog.py', 'tests/test_web.py'] }),
  editor: { file: 'tests/conftest.py', code, show: [[1, 2], [lineOf(code, '@pytest.fixture'), code.trimEnd().split('\n').length]], highlight: linesFrom(code, 'monkeypatch.delenv', 'with mock_aws():') },
  session,
  keep: [['collected 5 items', 'test_an_unknown_book_is_404'], '5 passed'],
  side: [
    {
      type: 'group', id: 'where', title: 'Where a test\'s S3 call goes', tone: 'source', children: [
        { type: 'item', id: 'test', icon: 'check', title: 'a test', sub: 'pytest', stack: true },
        { type: 'item', id: 'app', icon: 'python', title: 'the app\'s code', sub: 'unchanged', stack: true },
        { type: 'item', id: 'boto', icon: 'python', title: 'boto3', sub: 'the real client', stack: true },
        {
          type: 'group', id: 'targets', bare: true, dir: 'row', children: [
            { type: 'item', id: 'mock', icon: 'layers', title: 'mock_aws', sub: 'in the test process', stack: true, tone: 'ingest' },
            { type: 'item', id: 'away', icon: 'cloud', title: 'emulator or AWS', sub: 'unreachable: no endpoint, fake keys', stack: true, muted: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'kinds', title: 'Emulator or mock', tone: 'ingest', columns: ['', 'emulator', 'mock_aws'], rows: [
        ['runs', 'a server, port 5000', 'inside the test'],
        ['state', 'kept between commands', 'fresh for every test'],
        ['for', 'the course\'s terminal', 'the app\'s tests'],
      ],
    },
  ],
  edges: [
    { from: 'test', to: 'app' },
    { from: 'app', to: 'boto' },
    { from: 'boto', to: 'mock', label: 'intercepted' },
  ],
})
