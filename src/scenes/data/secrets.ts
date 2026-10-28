import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { dataTree } from './files'
import code from '../../../spine/data/06-secrets/project/book_shop/orders.py?raw'
import session from '../../../spine/data/06-secrets/session.txt?raw'

// §7.6 — credentials from Secrets Manager. RDS keeps the master password in a secret it manages
// (and can rotate); the app reads it at connect time with its role. Under IAM enforcement the role
// reads that one secret (the username shown, the password's LENGTH only) and is refused the payments
// key — the emulator's real decisions (scripts/moto_server.py, `secret-resource`).
// source: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html
export const dataSecrets: SceneModel = ideFrame({
  tree: dataTree(6, { active: 'book_shop/orders.py', fresh: ['infra/secrets.tf'] }),
  editor: { file: 'book_shop/orders.py', code, show: [[lineOf(code, 'def connect'), lineOf(code, 'def place_order') - 3]],
    highlight: linesFrom(code, 'if arn := os.environ.get("DB_SECRET_ARN"):', 'login = json.loads') },
  session,
  keep: ['Apply complete!', ['$ SECRET=', '"password":28}'], ['$ tools/as-app.sh aws secretsmanager get-secret-value \\', '(403)']],
  side: [
    {
      type: 'group', id: 'path', title: 'The password, at connect time', tone: 'source', children: [
        { type: 'item', id: 'app', icon: 'python', title: 'orders.connect()', sub: 'DB_SECRET_ARN, DB_HOST: no password', stack: true },
        { type: 'item', id: 'role', icon: 'iamrole', title: 'BookShopApp', sub: 'ReadDatabaseSecret: one ARN', stack: true },
        { type: 'item', id: 'secret', icon: 'secretsmanager', title: 'rds!db-… secret', sub: 'kept and rotated by RDS', stack: true },
        { type: 'item', id: 'db', icon: 'rds', title: 'book-shop-orders', sub: 'user shop, over TLS', stack: true },
      ],
    },
    {
      type: 'table', id: 'reads', title: 'What the role may read', tone: 'ingest', columns: ['secret', 'result'], rows: [
        { cells: ['the database\'s', 'its username, a 28-character password'], tone: 'ingest' },
        { cells: ['book-shop/payments-api-key', 'AccessDenied'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'app', to: 'role', label: 'signs with' },
    { from: 'role', to: 'secret', label: 'GetSecretValue' },
    { from: 'secret', to: 'db', label: 'logs in' },
  ],
})
