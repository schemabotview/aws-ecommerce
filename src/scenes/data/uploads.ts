import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { dataTree } from './files'
import code from '../../../spine/data/03-uploads/project/book_shop/uploads.py?raw'
import session from '../../../spine/data/03-uploads/session.txt?raw'

// §7.3 — uploads without credentials. The app signs a URL (SigV4 in the query string): one PUT, one
// key, 5 minutes, with the signer's permissions — the role may sign only reviews/* (iam.tf,
// SignPhotoUploads). curl, holding no AWS credentials at all, PUTs the photo with it; the emulator
// stores it. That an expired URL is refused is AWS's documentation (the replay's clock is frozen).
// source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
export const dataUploads: SceneModel = ideFrame({
  tree: dataTree(3, { active: 'book_shop/uploads.py', fresh: ['infra/uploads.tf', 'book_shop/uploads.py', 'data/photos/r-77.jpg'] }),
  editor: { file: 'book_shop/uploads.py', code },
  session,
  keep: [['$ python -m json.tool', '"url": "https'], ['$ curl -s -w', '200'], ['$ aws s3 ls', 'r-77.jpg']],
  side: [
    {
      type: 'group', id: 'steps', title: 'A photo, straight to S3', tone: 'source', children: [
        { type: 'item', id: 's1', icon: 'screen', title: '1 · the browser asks the app', sub: 'POST …/reviews/r-77/photo', stack: true },
        { type: 'item', id: 's2', icon: 'python', title: '2 · the app signs a URL', sub: 'with its role; nothing is sent to S3', stack: true },
        { type: 'item', id: 's3', icon: 'screen', title: '3 · the browser PUTs the photo', sub: 'to the URL; it holds no credential', stack: true },
        { type: 'item', id: 's4', icon: 's3', title: '4 · S3 checks, then stores', sub: 'signature, expiry, the signer\'s permission', stack: true },
      ],
    },
    {
      type: 'table', id: 'url', title: 'What the signed URL allows', tone: 'ingest', columns: ['', ''], rows: [
        ['method', 'PUT, nothing else'],
        ['key', 'reviews/bk-1001/r-77.jpg only'],
        ['for', '300 seconds'],
        ['as', 'the signer: reviews/* only'],
      ],
    },
  ],
  edges: [
    { from: 's1', to: 's2' },
    { from: 's2', to: 's3', label: 'the URL' },
    { from: 's3', to: 's4', label: 'PUT' },
  ],
})
