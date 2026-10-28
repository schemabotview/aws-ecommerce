import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { runTree } from './files'
import code from '../../../spine/run/04-image/project/Dockerfile?raw'
import session from '../../../spine/run/04-image/session.txt?raw'

// §6.4 — an image, and a registry for it. The Dockerfile pins its base by digest and installs a
// locked requirements.txt; the build is real (Docker, here), so is the container run against the
// emulated bucket. ECR is emulated: it takes the image's manifest (tools/push_image.py), not its
// layers — the frame says so. The layer sizes are READ from the recorded `docker history`.
const history = (match: RegExp) => session.split('\n').find((l) => l.includes('\t') && match.test(l))?.split('\t')[0] ?? '?'
const layers: [string, string, string, string][] = [
  ['l-app', 'file', 'the app: book_shop/', history(/COPY book_shop/)],
  ['l-deps', 'package', 'boto3 and its locked dependencies', history(/pip install/)],
  ['l-python', 'python', 'Python 3.13', history(/savedAptMark/)],
  ['l-os', 'layers', 'Debian, slim', history(/debian\.sh/)],
]

export const runImage: SceneModel = ideFrame({
  tree: runTree(4, { active: 'Dockerfile', fresh: ['Dockerfile', '.dockerignore', 'requirements.txt', 'infra/ecr.tf', 'tools/push_image.py'] }),
  editor: { file: 'Dockerfile', code },
  session,
  keep: ['$ docker build', ['$ docker run', 'book-shop:1.0.0'], ['$ curl', '"title"'], ['$ python tools/push_image.py', 'sha256:']],
  side: [
    {
      type: 'group', id: 'image', icon: 'docker', title: 'book-shop:1.0.0, layer by layer', tone: 'source', children: layers.map(([id, icon, title, size]) => (
        { type: 'item', id, icon, title, sub: size, tone: id === 'l-app' ? 'serve' : undefined })),
    },
    {
      type: 'group', id: 'goes', bare: true, dir: 'row', children: [
        { type: 'item', id: 'run', icon: 'container', title: 'a container', sub: 'docker run: the image, started', stack: true },
        { type: 'item', id: 'ecr', icon: 'ecr', title: 'ECR: book-shop', sub: 'its manifest · emulated', stack: true },
      ],
    },
    {
      type: 'table', id: 'frozen', title: 'What the image freezes', tone: 'ingest', columns: ['in the image', 'not in it'], rows: [
        ['the OS and Python, by digest', 'which bucket: CATALOG_BUCKET'],
        ['every package, by version', 'credentials: from the role'],
        ['the code', 'the data: in S3'],
      ],
    },
  ],
  edges: [
    { from: 'image', to: 'run', label: 'run' },
    { from: 'image', to: 'ecr', label: 'push' },
  ],
})
