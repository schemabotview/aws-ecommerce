# 001: Where the orders live

Status: accepted, 2026-11-02. Revisit: at 10 times today's orders.

## Context

The orders database is RDS PostgreSQL, db.t4g.micro, Multi-AZ (Course 7).
September: 30,000 orders. Two alternatives keep coming up. This records
the choice, and why, so the next person does not have to guess.

## Musts (an option that fails one is out)

| must | RDS PostgreSQL | Aurora Serverless v2 | DynamoDB only |
| --- | --- | --- | --- |
| an order and its lines commit together | yes | yes | yes |
| stock never goes below zero | yes | yes | yes |
| restore to any second of the last 35 days | yes | yes | yes |
| the reports' SQL runs unchanged | yes | yes | no |

## Wants (weight 1 to 3; each option scored 1 to 5)

| want | weight | RDS PostgreSQL | Aurora Serverless v2 | DynamoDB only |
| --- | --- | --- | --- | --- |
| monthly cost at today's load | 3 | 5 | 3 | 4 |
| effort to run it | 2 | 4 | 4 | 5 |
| the team already knows it | 2 | 5 | 4 | 2 |
| headroom for 10 times the orders | 1 | 2 | 5 | 5 |

## Decision

Stay on RDS PostgreSQL. Aurora Serverless v2 wins only on headroom, which
is not needed yet; DynamoDB alone would mean rewriting every report.

## Consequences

The instance size is the ceiling: watch CPU and connections (Course 11).
At 10 times the orders, score this again with real numbers.
