---
title: "Du Zhenqiang on TiDB: Distributed Databases, Cloud Evolution, and Open Source"
summary: "Two recordings cover TiDB, TiKV, PD, and TiFlash; sharding, HTAP, cloud elasticity, and use cases; then AI tools, international expansion, a career change into databases, and open-source business models."
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 32
author: editorial-team
topics:
  - Databases
  - Cloud Native
  - Open Source
  - Engineering
relatedEvents: []
relatedRecordings:
  - du-zhenqiang-tidb
cover: /images/default-cover.svg
coverAlt: General cover for Du Zhenqiang's historical talk on TiDB, not a photo of the guest or event
citations:
  - label: "Du Zhenqiang's technical talk on TiDB cloud-native distributed databases"
    url: https://www.bilibili.com/video/BV1WX4y1R7me?p=1
  - label: "Full interview with Du Zhenqiang"
    url: https://www.bilibili.com/video/BV1Hh411V77v?p=1
  - label: "Official TiDB v6.5 documentation on TiFlash"
    url: https://docs.pingcap.com/tidb/v6.5/tiflash-overview/
tldr:
  - "Database history reflects changing scale and uses: Du started with relational databases: commercial products and later open-source alternatives met the needs of different periods."
  - "Elasticity depends on how data moves: In a traditional scale-out, a new storage node receives data from nodes already serving traffic."
  - "Competing databases require years of product work: Finally, Du acknowledged the depth of established international database vendors."
faq: []
featured: false
draft: false
translationOf: du-zhenqiang-tidb-recap
translationStatus: reviewed
seo:
  title: Du Zhenqiang on TiDB, Cloud, and Open Source | T Salon
  description: A recap of two talks on TiDB architecture, HTAP, cloud elasticity, use cases, AI, international work, career change, and open-source business.
  noindex: false
---

> These two recordings were published in March 2023. Product versions, personal experiences, and opinions below refer to that period.

Du Zhenqiang was working on industry solutions at PingCAP and had spent years with databases in e-commerce and internet businesses. His technical presentation began with the problem TiDB aims to solve, then covered cloud architecture and suitable workloads. The interview moved from ChatGPT to international business, career choices, open source, and commercialization. Together the recordings last about 83 minutes.

## Database history reflects changing scale and uses

Du started with relational databases: commercial products and later open-source alternatives met the needs of different periods. Growth in internet and mobile internet services then pushed data volume, throughput, and analytical demand beyond what a single machine could easily handle.

The industry did not find one universal answer. Big-data systems took on larger analyses; NoSQL explored different models and expansion strategies; application teams also kept relational databases while splitting data across databases and tables. Each solved part of the problem and introduced its own operating costs.

He placed NewSQL in that sequence: an attempt to combine relational transactions with horizontal growth in distributed systems. Meanwhile, infrastructure moved from large machines and self-owned servers toward cloud services. Deployment, resource management, and delivery changed along with it. That context led into TiDB and cloud-native design.

## Distinguish the company, database, and components

Du first clarified PingCAP's relationship to TiDB and described a product developed in the open. He mentioned community size, users, and industry attention as background at the time. The technical aim was more central: retain transactions while scaling out and make node failures, growth, and varying workloads manageable.

His positioning used two dimensions. How much data and concurrency can a system carry? How long will a user wait for a query? Transactional requests usually seek low latency, while large analyses can take longer. TiDB aims to keep processing transactions as scale grows and bring some analyses nearer to real time. Distributed transactions still require network communication and do not have the same cost as accessing memory within one process. His numerical capacity and latency comparisons were illustrations under particular conditions, not guarantees for every deployment.

### TiDB handles SQL; TiKV and TiFlash serve different access patterns

An application uses a MySQL-compatible interface to reach TiDB. The SQL layer parses and plans a request, coordinates execution, and retrieves data from storage. Separating stateless computing from storage allows each to be considered for expansion independently.

TiKV holds row-oriented data; TiFlash provides a columnar replica and analytical capability. A point lookup for one order may favor rows. A broad aggregation by date and status may favor columns and parallel processing. The optimizer can choose a path, or combine paths, without requiring two different application interfaces. Internally, the database still has to manage replicas, plans, and workload interference. HTAP is more than attaching a second store.

### PD tracks placement, scheduling, and timestamps

Data is divided into Regions. PD gathers information about their location, size, and load and coordinates placement. The SQL layer also needs a route to the data it will read.

Transactions need a consistent order across machines whose local clocks may not exactly match. Du used that problem to explain timestamp services. He compared a centralized approach with hardware-assisted and hybrid-logical-clock approaches, each carrying a different equipment cost, delay, or implementation complexity. PD is therefore involved not only in where data lives but in the temporal ordering a distributed transaction needs.

### Regions and replicas put scheduling inside the database

Each Region has replicas cooperating through Raft. Du broke down a write: it reaches a Leader, is replicated to enough nodes to satisfy a majority, and only then is confirmed upwards. If the Leader fails, other nodes that received the record can take part in recovery. This is why a write cannot be judged solely by one machine receiving a request.

Region locations and load go back to PD. When a new storage node joins, PD can move some Regions to it progressively to rebalance space and traffic; the application does not recalculate which physical order table should receive each row. TiDB also provides distributed transactions and automatic sharding without requiring an application to split every logical table and own every route. TiKV can be used directly through a key-value interface as well, which is distinct from accessing relational data through TiDB.

## Sharding costs grow as a business changes

Splitting a database into physical shards is a familiar response to single-machine limits. The long-term questions are how to split again, maintain many instances, and prevent the application from depending on the split.

Suppose orders are sharded by order ID. An order-ID lookup is straightforward, but “all orders by this user” or “transactions for this merchant” may fan out over many shards. Teams may keep additional user- or merchant-oriented copies, raising write and maintenance costs. Moving from four databases to eight and then sixteen brings routing changes and migration. “Can shard” is not the same as “remains easy for the business to use.”

Cross-shard transactions, joins, availability, and consistency add more work. Middleware, replication, databases, and failover tools all form part of the system. TiDB aims to carry more sharding, scheduling, and transaction responsibility inside the database so that a business need not redesign its routes each time it grows.

Expansion still has a cost. The node counts and throughput in the recording explained a direction of scale, while an actual plan must consider hot spots, SQL patterns, network, storage, and failure conditions.

## HTAP asks how transactions and analysis work together

### Rows and columns serve different queries

TiFlash is the analytical columnar route. A single order and a broad analysis by status or date need different data access. The optimizer can use statistics to choose TiKV, TiFlash, or a combination; analytical work can use parallel execution.

Replication and read consistency must be distinguished. TiFlash is not a second primary store into which the application writes. The [official v6.5 documentation](https://docs.pingcap.com/tidb/v6.5/tiflash-overview/) says its columnar replicas receive data asynchronously as Raft Learners and validate replication progress when read to provide snapshot isolation. The talk's “read after writing” description must not be interpreted as replication that never waits.

### Fewer links do not eliminate every analytical preparation

Du walked through a conventional chain: an online relational database records an order or user action; a synchronization tool reads changes; a message system carries them; an analytical store transforms and queries them. If the result must feed online risk control or recommendations, it returns to an online service. Every step needs deployment, recovery, latency checks, and people who understand it.

TiFlash can remove some extra links built around the same data. Du mentioned real-time risk control and user profiling as examples where transactions and analysis may fit within a more unified system. Cross-source cleaning, complex transformations, and a separate analytical platform can still be necessary. The claim was an integration opportunity, not the end of data engineering.

### Table changes affect delivery speed

Online DDL was another focus. Changing a large order table, especially one split into many physical tables, may require creating a replacement, moving old rows, following new writes, and finally switching over without stopping traffic. Locks and replica lag complicate the schedule.

TiDB's online schema changes aim to move more of this work into the database. Adding an index remains different from a metadata-only change: existing records still have to be read and organized. The talk's estimates for building an index on very large tables belonged to the version and workload then, not to every table in a guaranteed number of hours.

Du also mentioned future performance, stability, multi-tenancy, and cloud work. Demonstration speedups and projected releases were goals or results under the conditions of the talk, not fixed outcomes for every version.

## The cloud leads to a further split between computing and storage

### Hosting is a beginning, not the whole architecture

On TiDB Cloud, Du distinguished the deployment available then from a newer design in progress. Moving a database into cloud hosting does not by itself exploit object storage, elastic compute, and on-demand use.

He discussed placing complete data in object storage while keeping data needed for low-latency access on local disk or in a cache. He raised the obvious objection himself: if every small transaction reads a remote object, latency and request overhead become unacceptable. The object store can provide the full data foundation, while a local layer serves frequent small requests. The two roles must be designed together.

### Elasticity depends on how data moves

In a traditional scale-out, a new storage node receives data from nodes already serving traffic. Copying consumes resources on both sides, so it may have to be throttled and take time. If the full data set is in object storage, a new node can load from that shared foundation and prepare local data with less dependence on peer nodes. That was the reasoning behind a faster scaling path in Du's proposed architecture.

He also discussed compaction in LSM trees. If each replica independently performs similar reorganizations, CPU and I/O work is repeated. Shared underlying data could remove some duplication and create room for a different replica arrangement. His speedup numbers and possible replica changes were tests and future designs at the time; they are not a universal reliability or performance promise for any cluster.

### Analytical computing must follow peaks and troughs

TiFlash both stores data and computes analyses. Du wanted to split those roles further so compute could scale with analytical demand. Reports may run mostly in fixed early-hour windows, leaving a peak-sized cluster underused for much of the day. Storage in a shared layer and more disposable compute nodes could support faster expansion before the peak and contraction afterward.

The path pointed toward stronger elasticity and pay-as-needed use. Release timing in the video was a plan, not proof that all the described features were already generally available.

## Choose scenarios by workload and resource threshold

Du grouped use cases into three broad needs: large, high-throughput transactional businesses that want fewer repeated sharding migrations; several businesses sharing resources with appropriate isolation; and workloads needing both transactions and analysis with a shorter path between them.

A small business does not automatically benefit from a separate distributed cluster. Its components and replicas have a minimum resource cost. Du suggested combining many small workloads in a resource pool where peaks differ, then choosing an isolation level. Ordinary workloads may share logical isolation; particularly important order or payment data may be assigned to specified storage nodes. Multi-tenancy is not simply mixing everything without boundaries.

Payment, content, games, risk control, advertising, and on-chain analysis appeared as historical workload examples. Their value in the talk was showing workload shapes, not replacing validation with a client name.

## AI could first improve the interface between people and databases

The technical presentation demonstrated Chat2Query: describe a desired result in natural language, inspect the generated SQL, and execute it only after checking. Du expected it to lower the entry barrier while acknowledging the generation quality still needed improvement.

In the interview, he suggested AI could help standardize technical documentation written by different engineering and product roles and assist translation for overseas teams. One author's description might be much harder for users to read than another's. He described requesting a certain English style for material going to Southeast Asian colleagues. The host described preparing an English speech as a manager by giving a tool the occasion and central message, then judging its draft. Both assumed a person knew what they meant to say.

They imagined a personal assistant that could consider calendars, meeting goals, and collaborators' time. That was a future scenario, not a claim that the tools then had access to every company schedule or business record.

### Code and operations still have to be judged in a real task

They discussed assistance with code, architecture, and database operations. The host also recalled generated code that left a “to do” item for a human, showing how a fluent draft can still be incomplete. Du saw the tool as help for standardized or mechanical work, with people responsible for judgment. The host emphasized that a general model does not automatically know a company's business data. They imagined different possible futures, but claims of inevitable job replacement remained speculation.

## A move into databases depends on which database work is meant

An audience member asked whether a Java developer facing competition could switch to database development. Du did not treat a language as an absolute barrier. Database kernels involve storage, transactions, distributed systems, and implementing research ideas. A mentor and an opportunity to work on a real project can matter more than learning another syntax in isolation.

When the host restated the answer as “so you do not recommend the move,” Du did not turn it into a ban. He said the learning investment is substantial and databases also have competitors. Someone with business-domain experience might build considerable value by going deeper in that domain. Moving only because the present field feels crowded could exchange one competitive area for another.

## International database plans involve geography, communication, and bills

Du observed that teams expanding overseas often use cloud services rather than build their own data centers and local operations groups. Their database plans still need to address data placement, cross-region synchronization, recovery, and security conditions in each location.

Technical concepts need re-explanation, not just word-for-word translation. His example was the Chinese shorthand for splitting databases and tables. Chinese engineers might hear it and assume a whole set of routing practices; colleagues elsewhere may not use that umbrella term. Explain why the data was split, how a shard is chosen, and which rules the application must obey before comparing solutions.

He particularly warned about a cloud bill. The machine configuration is only one line; network transfers, additional components, and different operations may also be charged. His experience of unexpectedly large bills was a prompt to examine a provider's full pricing model, not a price rule for every provider.

Asked where data for Southeast Asian businesses should be located, he gave a broad on-air answer. The enduring engineering question is specific to each country, data type, and business arrangement. An entire region does not share one legal regime, and the answer does not establish that every cross-border transfer is unlawful. A later question about software development versus cybersecurity returned to personal interests and sustained effort rather than one universally superior career path.

## Native distribution versus middleware: who owns the complexity?

In the interview, Du returned to cloud-native and distributed design. Storage/compute separation, resource pooling, and elastic adjustment were important goals to him; distributed architecture was one route toward them. A “cloud-native” name alone does not prove a product offers every cloud capability.

Both middleware-based sharding and a native distributed database use partitions to carry more data. The difference is how much of the partitioning the application must know. With middleware, a business may choose a shard key, maintain routing, and accept limitations in queries and transactions. In TiDB, Regions and PD manage more of data placement, while distributed transactions remain part of the database's responsibilities.

The host asked whether hiding shards always made learning and maintenance cheaper. Du separated application complexity from minimum resources: one small MySQL instance can begin on one machine; a distributed installation needs several components and replicas. Developers may write fewer routing and migration rules, yet a small workload might fit better alongside other workloads in a shared cluster than in its own cluster. A choice must count both application work and infrastructure cost.

They also discussed cross-partition queries, replication consistency, schema changes, and operations tools. Complexity does not vanish; more of it moves from each business application into the database and its tooling.

## Open-source communities and commercial services meet different needs

Du named new ideas, code, and feedback from real use as open-source value. Different teams try the database in situations one vendor cannot anticipate, report problems, and reveal where the product fits.

The community still requires investment. Early users need documentation, discussion, support, and training. Only as experience spreads can some support become peer-to-peer. Publishing a repository is not the end of that work.

Commercial users may want a managed database and less operational burden. Cloud hosting or technical support can take on continuing service responsibilities. They are buying delivery and operation, not merely access to code. The host added that reading, contributing, and cooperating also benefit community members who never become customers. This was one combination of product, community, and service, not a universal monetization formula.

## Competing databases require years of product work

Finally, Du acknowledged the depth of established international database vendors. A new architecture can create room to differentiate, but it cannot replace stability, product completeness, and proof in real workloads.

He also saw more developers in China able to read database kernels and work on lower layers. Talent, real scenarios, and sustained investment make stronger products possible; the outcome still takes time. Both recordings ultimately return to the same question: how a technical choice becomes a sustainable product, team, and business practice.

## Full recordings

- [Du Zhenqiang's technical talk on TiDB cloud-native distributed databases](https://www.bilibili.com/video/BV1WX4y1R7me?p=1)
- [Full interview with Du Zhenqiang](https://www.bilibili.com/video/BV1Hh411V77v?p=1)
