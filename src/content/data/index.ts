import type { Course, Section } from '../types'

// Course 7 · Keep its data (COURSE-PLAN.md). Narration is written for the speech engine: acronyms
// spelled ("A W S", "R D S", "S Q L"), account ids digit by digit in groups, prices as words.

const choosingWhereDataLives: Section = {
  id: 'choosing-where-data-lives',
  title: 'Choosing where data lives: files or records, and which kind',
  scene: 'data-choose',
  narration:
    "The shop has a few kinds of data now, and more are coming: book pages, review photos, orders, carts, stock counts. A W S has a store for each kind, and the first question splits them. Is it a file, or is it a record? Files and blobs go left. S three keeps whole objects by key, and that is where the book pages are, and where review photos will go. E B S is a disk for one server, and E F S is a file system many servers share; the shop uses neither, because its Fargate tasks keep nothing on disk. Records go right, and here the question is how they are used. An order is several rows that must change together or not at all, and the finance team will ask questions of them in S Q L, so orders go to a relational database, R D S running PostgreSQL. A cart or a stock count is read and written by its key, very often, by any number of tasks, so those go to DynamoDB, a key value store that scales without a server to size. And the same book page, read thousands of times an evening, can be kept in memory in front of S three, in ElastiCache, accepting that the copy can be a little out of date. The table gives each need its reason. The rest of this course builds every one of these, in order: the catalog bucket, uploads, the orders database and its password, carts, the last copy in stock, and a cache.",
}

const theCatalogBucket: Section = {
  id: 'the-catalog-bucket',
  title: 'The catalog bucket: versions, a lifecycle and HTTPS only',
  scene: 'data-catalog',
  narration:
    "The catalog bucket has held book pages since Course 4, with no protection against a bad edit. The editor shows three additions to s three dot t f. Versioning: every write now keeps the page it replaced, so a mistake is undone by restoring the version before it, and a delete only hides an object. A lifecycle rule: an old version lives thirty days and is then deleted, so the bucket keeps history, not everything forever. And, in the bucket policy, a statement called https only: deny every action, to everyone, when the request did not arrive over H T T P S. In the terminal, apply makes the changes. Then the price of book one zero zero one changes, from twelve ninety nine to ten ninety nine, and we upload the new page. Listing the object's versions shows two. The latest, with a version I D, is the new page. The older one has the version I D null, because it was written before versioning was turned on. The side pane draws it: one key that readers ask for, two versions behind it, and the older one on its way out after thirty days. One honest note about the policy. The emulator listens on plain H T T P, but every request it stands in for is H T T P S on A W S, so it evaluates the policy as A W S would see those requests. That a plain H T T P request is refused is A W S's documentation, not something this run shows. Next, a bucket that shoppers write to, without ever holding a credential.",
}

const uploadsWithoutCredentials: Section = {
  id: 'uploads-without-credentials',
  title: 'Uploads without credentials: a URL the app signs',
  scene: 'data-uploads',
  narration:
    "Shoppers will attach a photo to a review. The photo should go straight from the browser to S three, without passing through the app, and the browser must never hold an A W S credential. The answer is a presigned U R L, and the editor shows the whole of it, uploads dot p y. The app asks boto three to sign a put object request for one key, reviews slash the book slash the review dot j p g, of type image j p e g, valid for three hundred seconds. Signing happens on the app's side, with the app's own permissions, and the role in i a m dot t f may sign uploads only under reviews. In the terminal, Terraform makes the uploads bucket: private, all public access blocked, and a cors rule that lets the shop's own pages, and only those, send a put. The app is started and asked for a U R L. The answer is the key, the expiry, and the U R L itself: the S three address, with the signature, the credential's I D and the expiry in its query string. Then curl, which holds no A W S credentials at all, puts the photo to that U R L, and the bucket answers two hundred. Listing the bucket shows the photo, six hundred and seventy six bytes, under reviews. The side pane numbers the steps: the browser asks the app, the app signs, the browser uploads. The table says exactly what the U R L allows: one method, one key, one content type, five minutes, and only what the signer may do. Next, the database for orders.",
}

const anOrdersDatabase: Section = {
  id: 'an-orders-database',
  title: 'An orders database: PostgreSQL on RDS, in two Availability Zones',
  scene: 'data-database',
  focus: 'db-a',
  narration:
    "Back on the map, the data subnets get their first tenant. The orders database appears in eu west two a, ringed, with its standby beside it in two b, and the secret that holds its password lights up along the bottom. The terminal shows the plan for an R D S instance: PostgreSQL sixteen point nine, the smallest instance class that runs in two zones, twenty gigabytes of encrypted storage, backups kept for seven days, in the data subnets, behind the database security group from Course 5. Two choices matter most. Multi A Z is on: R D S keeps a standby copy in a second Availability Zone and writes every change to it before the change commits, so if the primary's zone fails, the same name points at the standby within a minute or two, and no committed order is lost. The standby takes no reads; it exists to take over. And manage master user password is on: nobody chooses the password, R D S generates it and keeps it in Secrets Manager. Reading the instance back from the emulator shows Multi A Z true, the primary in eu west two a, the standby in eu west two b, the endpoint's name, and the A R N of that secret. The red note is the honest part. The emulator records the instance, its zones and its secret, but it runs no database. The S Q L in the next section runs in a real PostgreSQL sixteen on this machine, standing in for the one R D S would run. Next, placing an order, in one transaction.",
}

const placingAnOrder: Section = {
  id: 'placing-an-order',
  title: 'Placing an order: one transaction, all or nothing',
  scene: 'data-orders',
  narration:
    "An order touches several rows: the order itself, a line for each book, and the stock of each book. They must change together, or not at all, and that is what a transaction is for. The schema, in the migrations folder, has one rule that matters here: a book's stock must be zero or more, a check the database enforces itself. The editor shows place order, in orders dot p y. Inside one transaction, it reads the prices, inserts the order and gets its number back, then for each book inserts a line and takes the copies out of stock. In the terminal, we create the database, run the migration, which adds two books, and place two orders. Customer c seventeen buys two copies of book one zero zero one: order one, twenty one pounds ninety eight. Customer c eighteen asks for one copy of one zero zero one and two of one zero zero two, which has a single copy left. The side pane follows that second order. The transaction begins, the order and its first line are written, and one copy of one zero zero one is taken. Then two copies of one zero zero two would leave minus one, the check fails, and PostgreSQL rolls back everything the transaction did. The table proves it: there is still only one order, and one zero zero one's stock is thirty eight, not thirty seven, because the copy taken a moment earlier was given back. Nothing half done, no stock lost. This is real PostgreSQL output, not the emulator. Next, how the app gets the database password, without anyone handing it over.",
}

const credentialsFromSecretsManager: Section = {
  id: 'credentials-from-secrets-manager',
  title: 'Credentials from Secrets Manager: the password nobody types',
  scene: 'data-secrets',
  narration:
    "The orders database has a password that no person chose and nobody should copy. R D S keeps it in Secrets Manager and can rotate it. So the app must read it at the moment it connects, and the editor shows how, in orders dot p y. Connect looks for D B secret A R N. On A W S, the task gets that A R N and the database's address as environment variables, neither of them secret, and fetches the user and password from Secrets Manager with its role, then connects over T L S. On this machine, without that variable, it falls back to the local database. In i a m dot t f, the role gets one new statement, read database secret, for exactly one A R N: that secret. Terraform also creates a second secret, for the payment provider's A P I key in Course 8, and only the secret: its value will be set by hand, so it never sits in Terraform's state or in git. In the terminal, acting as the app, we read the database secret. The username is shop, and the password, which we print only the length of, is twenty eight characters. Then, still as the app, we try the payments key, and are refused: access denied. Under the emulator's I A M checks, the role reads the one secret it was given, and nothing else. The side pane follows the password at connect time: the code, the role, the secret, the database. Nothing about it is in the image, in the task definition, or in git. Next, carts, in a very different kind of database.",
}

const cartsInDynamodb: Section = {
  id: 'carts-in-dynamodb',
  title: 'Carts in DynamoDB: a key that keeps a cart together',
  scene: 'data-carts',
  narration:
    "A cart is read and written constantly, always by its owner's key, and it does not need S Q L. So carts go to DynamoDB, a table with no server to size, billed per request. The table's design is the key. The partition key is the customer, and the sort key is the book. Every book in one customer's cart therefore shares a partition key, and DynamoDB keeps them together, sorted by book, as one item collection. The editor shows cart dot p y. Add uses an update with add quantity, so adding the same book twice changes one item instead of making two, and it pushes the expiry thirty days out, for the table's time to live. Contents reads the whole cart with a single query on the customer's key. In the terminal, Terraform makes the table, on demand, with time to live on the expires attribute, and the role is allowed to query and update it. Then two shoppers fill their carts. Customer c seventeen adds two copies of one zero zero one and one of one zero zero two, then one zero zero one again, and the cart now holds three. A scan of the table shows three items. The side pane draws them as DynamoDB stores them: one item collection per customer, c seventeen with two books, c eighteen with one. And reading a cart is always the same three steps: the customer's key, hashed to one partition, and one query that returns every book in order. No join, no scan, at any number of shoppers. Next, two of those shoppers want the last copy of a book.",
}

const theLastUnitInStock: Section = {
  id: 'the-last-unit-in-stock',
  title: 'The last unit in stock: one checkout wins, one is cancelled',
  scene: 'data-last-unit',
  narration:
    "Both shoppers now have the same cart, three copies of book one zero zero one and one of one zero zero two, and there is one copy of one zero zero two left. A stock table now holds a count per book, and checkout, in stock dot p y, does two things in one DynamoDB transaction. For every book in the cart, it takes the copies out of stock, on a condition, highlighted: stock must be at least the number asked for. And it deletes the cart's items. Either all of it happens, or none of it. In the terminal, a small tool sets the stock, thirty eight and one, and starts both checkouts at the same moment, two threads released together. One transaction commits: that shopper bought both books. The other is cancelled, because when it came to check, the condition stock at least one was false. The scans prove what that means. Book one zero zero two's stock is zero, never minus one. Book one zero zero one's stock is thirty five: the winner's three copies were taken, and the loser's three were not, because a cancelled transaction takes nothing. And the losing shopper's cart is still there, both books in it, ready for another try. The side pane shows the race, and which shopper won is whatever the two threads did, read from this run. The table says why only one can win. The condition is checked and written in one step for each item, the transaction covers every item of a checkout, and no lock is ever held, so the loser does not wait, it fails at once and can try again. Next, a cache in front of the book pages.",
}

const aCacheForBookPages: Section = {
  id: 'a-cache-for-book-pages',
  title: 'A cache for book pages: fast, and how stale',
  scene: 'data-cache',
  narration:
    "In the evening, the same book pages are read thousands of times, and each read goes to S three. A cache keeps a copy in memory, close to the app. On the left is the pattern the shop would use, cache aside. To read a page, the app tries the cache. On a hit, it answers from memory. On a miss, it reads the catalog, and keeps the page in the cache for sixty seconds. To change a page, the app writes the catalog, and then deletes the cached copy, so the next read is a miss and fetches the new one. Below, Terraform plans the cache itself: ElastiCache running Valkey, the open source Redis, a primary and a replica in two zones, encrypted in transit. It is planned, not applied: the emulator cannot run ElastiCache's replication groups, and the frame says so. On the right is a simulation, with a dictionary for the cache and a clock we step, of the price change from earlier in this course. At ten seconds, book one zero zero one drops from twelve ninety nine to ten ninety nine. With a time to live alone, the cache keeps serving the old price until the copy expires: stale from ten seconds to fifty nine. When the write also deletes the cached page, the very next read is a miss, and every read after it shows ten ninety nine. The table sums up the trade: deleting on write costs one call per change and removes the stale window, and a time to live is still worth keeping, to bound the damage when a delete is missed. That completes Course 7: the shop keeps its data. Next course, its checkout stops waiting.",
}

export const data: Course = {
  id: 'data',
  title: 'Keep its data',
  sections: [choosingWhereDataLives, theCatalogBucket, uploadsWithoutCredentials, anOrdersDatabase, placingAnOrder,
    credentialsFromSecretsManager, cartsInDynamodb, theLastUnitInStock, aCacheForBookPages],
}
