import type { SceneModel } from '@graphlearning/graphl-flow'

// §4.1 — principals and authentication (concept). A principal is whoever makes a request. Every
// request carries a SIGNATURE made with a secret (SigV4); AWS first checks the signature and the key
// (authentication: who is this?), then the policies (authorization: may they? — the rest of the
// course). Long-term keys (an IAM user's, AKIA…) last until deleted; a ROLE SESSION's keys (ASIA…)
// come with a session token and expire, which is why people (Identity Center) and services (ECS)
// both act through roles. No command: the shop's own principals arrive in §4.2–4.3.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/intro-structure.html (principal, request, authentication, authorization)
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html (Signature Version 4)
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html (temporary credentials)
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html (AKIA / ASIA prefixes)
export const securePrincipals: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'flow', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'who', title: 'Principals: who makes the request', tone: 'source', children: [
            { type: 'item', id: 'root', icon: 'lock', title: 'the root user', sub: 'email + password; locked away (§3.1)', tone: 'consume' },
            { type: 'item', id: 'user', icon: 'user', title: 'an IAM user', sub: 'a long-term access key, AKIA…' },
            { type: 'item', id: 'person', icon: 'identitycenter', title: 'alex, through Identity Center', sub: 'a session in a role: BookShopDeveloper' },
            { type: 'item', id: 'service', icon: 'ecstask', title: 'the app, through ECS', sub: 'a session in a role: BookShopApp' },
          ],
        },
        {
          type: 'group', id: 'creds', title: 'What each signs with', tone: 'ingest', spread: true, children: [
            { type: 'item', id: 'long', icon: 'key', title: 'a long-term key', sub: 'lasts until someone deletes it', stack: true },
            { type: 'item', id: 'temp', icon: 'sts', title: 'temporary credentials', sub: 'ASIA… + a session token; they expire', stack: true },
          ],
        },
        {
          type: 'group', id: 'aws', title: 'What AWS checks, in order', tone: 'serve', children: [
            { type: 'item', id: 'request', icon: 'file', title: 'the signed request', sub: 'action, resource, key id, signature', stack: true },
            { type: 'item', id: 'authn', icon: 'fingerprint', title: '1 · authentication', sub: 'is the signature right? is the key real?', stack: true },
            { type: 'item', id: 'authz', icon: 'permissions', title: '2 · authorization', sub: 'do the policies allow it? (§4.4–4.8)', stack: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'kinds', title: 'Long-term or temporary', tone: 'source', columns: ['', 'long-term key', 'role session'], rows: [
        ['key id starts', 'AKIA', 'ASIA'],
        ['also needs', '—', 'a session token'],
        ['lasts', 'until deleted', '15 min – 12 h, then useless'],
        ['if it leaks', 'works until someone notices', 'stops working by itself'],
        ['the shop uses it for', 'nothing', 'alex, the app, later the pipeline'],
      ],
    },
  ],
  edges: [
    { from: 'user', to: 'long' },
    { from: 'person', to: 'temp' },
    { from: 'service', to: 'temp' },
    { from: 'temp', to: 'request', label: 'signs' },
    { from: 'request', to: 'authn' },
    { from: 'authn', to: 'authz' },
  ],
}
