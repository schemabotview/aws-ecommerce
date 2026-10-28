import type { Course, Section } from '../types'

// Course 10 · Report on sales (COURSE-PLAN.md). Narration is written for the speech engine: acronyms
// spelled ("A W S", "S Q L", "S three"), account ids digit by digit in groups, prices as words.

const stateAgainstHistory: Section = {
  id: 'state-against-history',
  title: 'State against history: two kinds of question',
  scene: 'report-history',
  narration:
    "The finance team has a question: what did we sell yesterday? The orders database could answer it, but it is the wrong place to ask. The frame starts with what the database is for. It holds the shop's state: one row per order, changed by every checkout, built for many small reads and writes, each touching a few rows. A sales report is the opposite shape of work: it reads a whole day, or a whole month, once, and adds it up. Run against the database, it competes with every checkout for the same machine, at exactly the moment the shop is busy. So history leaves the database. Along the top, the path this course builds. Every night, an export job copies yesterday's orders out of the database into a lake: a bucket of files, one folder per day, written once and never changed. A catalog describes those files: their columns, and how they are split into days. And a query engine reads only the days a question asks about. The first table sorts questions by where they belong. Is order twelve paid? How many copies are left? Those are about now, and the database answers them. What sold yesterday, and how September compared with August, are about the past, and the lake answers them. The second table puts the two shapes side by side: many small changes against few large reads, rows against columns, an instance running all day against storage and a charge per query. Next, the export itself.",
}

const exportingOrdersToALake: Section = {
  id: 'exporting-orders-to-a-lake',
  title: 'Exporting orders to a lake: a folder per day',
  scene: 'report-export',
  narration:
    "Terraform has made the lake: a private bucket, book shop lake, in the development account. Before anything can be exported by day, every order needs a day, so the first command in the terminal applies a migration that gives each order the time it was placed. The shop's real orders are the handful from Courses 7 and 8, far too few for a report, so the next command writes a month of trade that we made up for the course, and says so: thirty thousand orders in September, seeded, so every run writes the same month. Then the export job, open in the editor. It asks the database for one day's order lines at a time, highlighted: placed on or after that day, and before the next. It turns them into a table with a fixed schema, so the price column means the same thing in every file, and writes it as Parquet, highlighted: a file that stores each column together, compressed. Then it puts the file in the lake, under a key that names the day, highlighted: order history, slash, d t equals the date. Thirty files, just over sixty thousand order lines, under six hundred kibibytes for the month. Listing the lake counts thirty folders, one per day, and the first holds a single file. The side pane follows one night: the database, the job, and the bucket's layout, with September the thirtieth newest. Those d t equals folders are the point. A question about one day can now open one folder and ignore the rest, as long as something tells the query engine how the files are laid out. Next, that catalog.",
}

const aCatalogForTheLake: Section = {
  id: 'a-catalog-for-the-lake',
  title: 'A catalog for the lake: columns and partitions',
  scene: 'report-catalog',
  narration:
    "Files in a bucket are just files. A query engine needs to know what is in them: which columns, of which types, and how they are split. That description lives in the Glue Data Catalog, and the editor declares it: a database called book shop lake, and a table, order history, over the lake's files. The files do not move; the table only describes them. Its partition key is d t, highlighted near the bottom: the day in each folder's name. Above it, the table's parameters, highlighted, switch on partition projection. Without it, every new day would have to be added to the catalog, by a crawler or by hand, before a query could see it. With it, the engine works the folder out for itself: it takes the day from the query's filter and puts it into the location template, highlighted, order history slash d t equals the day. Tomorrow's export needs no change here: its folder is simply there. In the terminal, Terraform adds the database and the table, and the table's columns are read back from the catalog: order I D, customer, book, quantity, price, and when it was placed. The side pane shows how a query will use this. A filter names a day, the table turns it into a folder, and only that folder is read. The table below compares each column with the type the export job wrote into the files: they match, because both were fixed on purpose. One honest note: the emulator stores the table and its parameters; projection itself is applied by the query engine. Next, asking the question.",
}

const queryingIt: Section = {
  id: 'querying-it',
  title: 'Querying it: reading one day of thirty',
  scene: 'report-query',
  narration:
    "Athena runs S Q L over the lake's files where they lie. There is nothing to keep running between questions, and each query is charged by the data it scans. Terraform has made a workgroup for reports: it says where results go, and sets a limit, one gibibyte, that no query may scan past, a guard against an expensive mistake. The editor holds the question as a file: the five books that took the most money yesterday, September the thirtieth, highlighted in the filter on d t. In the terminal, the file is handed to Athena, which accepts it and returns a query I D. Here is the honest part. The emulator records the query; it does not run it. So the next two commands run the same file a second way. The lake's files are copied down, and a small tool hands the same S Q L to Duck D B, an engine that reads Parquet on a laptop, with the table defined exactly as the catalog defines it. The answer comes back: book two thousand and eighteen first, with a hundred and ninety nine copies and just over five thousand one hundred pounds, then four more. The last line is Duck D B's own account of the run: it read one file of thirty. The side pane draws that. Thirty day folders, twenty nine of them greyed: the filter on d t ruled them out before a single byte was read. On Athena, that is the bill: one day scanned instead of a month. Partitioning by the column you filter on most is the cheapest optimisation a lake has. Next, data that does not wait for the night: a stream.",
}

const aStreamOfClicks: Section = {
  id: 'a-stream-of-clicks',
  title: 'A stream of clicks: keys, shards and lag',
  scene: 'report-clicks',
  narration:
    "Orders can wait for the night. Clicks are different: the marketing team wants to see which books people are looking at now, so every page view goes into a stream as it happens. The editor declares it, a Kinesis data stream called book shop clicks, with two shards, highlighted. A shard is a lane: each takes up to a thousand records a second, so more traffic means more shards. The stream keeps every record for twenty four hours, also highlighted, so a consumer that falls behind can catch up. Each record carries a partition key, and here the key is the shopper's session. The key decides the shard, which means one session's clicks always land in the same shard, in the order they happened. In the terminal, a small tool sends a thousand made up clicks from fifty sessions, and reports where each went. Five hundred and ninety six landed in shard zero, and four hundred and four in shard one. Not an even split, because the split follows the keys, and some sessions click more than others: a busy key makes a busy shard. No session was split across the two. Then each shard is read back from its start. The plot below is a model, labelled as one. One consumer per shard reads six hundred clicks a second, and the evening peaks at sixteen hundred. With two shards, each gets eight hundred: the consumer falls behind from about ten past six, and by ten to seven it is nearly seven minutes behind. With four shards, it never falls behind at all. Lag is the number to watch on a stream. Next, choosing where the shop's history should be answered.",
}

const lakeWarehouseOrCluster: Section = {
  id: 'lake-warehouse-or-cluster',
  title: 'Lake, warehouse or cluster: where to answer questions',
  scene: 'report-choose',
  narration:
    "The shop now answers its sales questions from a lake, with Athena. That is one of three common ways, and the frame places them side by side over the same files. Along the top, the lake and the catalog: the same Parquet files, and one table definition, which any of the three can read. On the left, querying in place: Athena, what this course built. Nothing runs between queries, and each one costs the data it scans. In the middle, a warehouse: Redshift, where the data is loaded into tables kept ready for many repeated queries from many people, the dashboards a business opens every morning. On the right, a cluster: E M R, which runs your own code, usually Spark, for the transformations that S Q L cannot express. The table makes the choice concrete. Athena fits a few questions a day, asked in S Q L, and costs nothing when nobody asks. Redshift fits when reports become dashboards that dozens of people refresh, because then keeping data warm beats scanning files every time. E M R fits jobs rather than queries: cleaning, joining and reshaping large data with code. The last row is the shop today: thirty thousand orders a month and a few reports a day is Athena's shape, and the other two wait until the questions change. That completes Course 10: the shop knows what it sold, without slowing a single checkout. Next course, operating it: knowing when something is wrong, and what to do about it.",
}

export const report: Course = {
  id: 'report',
  title: 'Report on sales',
  sections: [stateAgainstHistory, exportingOrdersToALake, aCatalogForTheLake, queryingIt, aStreamOfClicks, lakeWarehouseOrCluster],
}
