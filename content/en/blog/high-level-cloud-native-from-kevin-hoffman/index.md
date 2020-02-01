---
title: "High Level Cloud Native From Kevin Hoffman"
date: 2017-09-15T20:32:47+08:00
draft: false
categories: ["cloud native"]
description: "Kevin Hoffman address that 15 Factors of Cloud Native."
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/kevin-hoffman-t11.jpg"
aliases: "/en/posts/high-level-cloud-native-from-kevin-hoffman"
type: "post"
---

Kevin Hoffman(From Capital One, twitter [@KevinHoffman](https://twitter.com/KevinHoffman)) was making a speech on *TalkingData T11 Smart Data Summit*.

He addressed that **15 Factors of Cloud Native** which based on Heroku's original [Twelve-Factor App](https://12factor.net), but he add more 3 another factors on it.

Let's have a look at the 15 factors of Cloud Native.

## 1. One codebase, one App

- Single version-controlled codebase, many deploys
- Multiple apps should not share code
  -  Microservices need separate release schedules
  -  Upgrade, deploy one without impacting others
- Tie build and deploy pipelines to single codebase


## 2. API first 

- Service ecosystem requires a contract 
  - Public API
- Multiple teams on different schedulers
  - Code to contract/API, not code dependencies
- Use well-documented contract standards
  - Protobuf IDL, Swagger, Apiary, etc
- API First != REST first
  - RPC can be more appropriate in some situations

## 3. Dependency Management 

- Explicitly declare dependencies
- Include all dependencies with app release
- Create immutable build artifact (e.g. docker image)
- Rely on smallest docker image
  - Base on scratch if possible
- App cannot rely on host for system tools or libraries

## 4. Design, Build, Release, Run

- Design part of iterative cycle
  - Agile doesn’t mean random or undesigned
- Mature CI/CD pipeline and teams
  - Design to production in days not months
- Build immutable artifacts
- Release automatically deploys to environment
  - Environments contains config, not release artifact

## 5. Configuration, Credentials, Code

- "3 Cs" volatile substances that explode when combinded
- Password in a config file is as bad as password in code
- App must accept "3 Cs" from **environment** and only use harmless defaults
- Test - Could you expose code on Github and not reveal passwords, URLs, credentials?

## 6. Logs

- Emit formatted logs to stdout
- Code should not know about destination or purpose of log emissions
- Use downstream log aggregator
  - collect, store, process, expose logs
  - ELK, Splunk, Sumo, etc
- Use **structured** logs to allow query and analysis
  - JSON, csv, KV, etc
- Logs are not metrics

## 7. Disposability

- App must start as quickly as possible
- App must stop quickly and gracefully
- Processes start and stop all the time in the cloud
- Every scale up/down disposes of processes
- Slow dispose == slow scale
- Slow dispose or startup can cause availability gaps

## 8. Backing Services

- Assume all resources supplied by backingservices
- Cannotassume mutable file system
  - “Disk as a Service” (e.g. S3, virtual mounts, etc)
- Every backing service is bound resource
  - URL, credentials, etc-> environment config
- Host does not satisfy NFRs
  - Backing services and cloud infrastructure

## 9. Environment Parity

- “Works on my machine”
  - Cloud-native anti-pattern. Must **work everywhere**
- Every commit is candidate for deployment
- Automated acceptance tests
  - Provide no confidence if environments don’t match

## 10. Administrative Processes

- Database migrations
- Run-once scripts or jobs
- Avoid using for batch operations, consider instead:
  - Event sourcing
  - Schedulers
  - Triggers from queues, etc
  - Lambdas/functions

## 11. Port Binding

- In cloud, infrastructure determines port
- App must accept port assigned by platform
- Containers have internal/external ports
  - App design must embrace this
- Never use reserved ports
- Beware of container “host mode” networking

## 12. Stateless Processes

- What is stateless?
- Long-term state handled by a backing service
- In-memory state lives onlyas long as request
- Requests from same client routed to different instances
  - “Sticky sessions” cloud native anti-pattern

## 13. Concurency

- Scale horizontally using the process model
- Build disposable, stateless, share-nothing processes
- Avoid adding CPU/RAM to increase scale/throughput
- Where possible, let platform/libraries do threading
  - Many single-threaded services > 1 multi-threaded monolith

## 14. Telemetry

- Monitor apps in the cloud like satellite in orbit
- No tether, no live debugger
- Application Perf Monitoring (APM)
- Domain Telemetry
- Health and system logs

## 15. Authentication & Authorization

- Security should never be an afterthought
- Auth should be explicit, documented decision
  - Even if anonymous access is allowed
  - Don’t allow anonymous access
- Bearer tokens/OAuth/OIDC best practices
- Audit all attempts to access

## Migrating Monoliths to the Cloud

After this 15 factors, he also gave us some tips about how to **migrate monoliths to the Cloud**:

- Make a rule - stop adding to the monolith
  - All new code must be cloud native
- Prioritize features
  - Where will you get most benefit from cloud native?
- Come up with a plan
  - Decompose monolith over time
  - Fast, agile iterations toward ultimate goal
- Use multiple strategies and patterns

## Go - the Best Language for Building Cloud Native App

At last, he advise us the programming language Go is the best language to build Cloud Native applications for these reasons below:

- Lightweight
- Easily learning curve
- Compiles to native binaries
- Very fast
- Large, thriving, engaged community
  - http://gopherize.me

Kevin also wrote a book **Cloud Native Go** to show how to **Building Web Applications and Microservices for the Cloud with Go and React**. This book has been translated to Chinese by four guys from TalkingData with ❤️. 《Cloud Native Go 构建基于Go和React的云原生Web应用与微服务》published by PHEI publisher house. See the website I built for this book https://jimmysong.io/cloud-native-go/

Kevin was signing his name on the book

![kevin siging on the book](https://res.cloudinary.com/jimmysong/image/upload/images/kevin-hoffman-siging-on-the-book.jpg)

This is his first visit to China, as a main translator of this book I an honored to be with him to take this photo.

![kevin hoffman with me](https://res.cloudinary.com/jimmysong/image/upload/images/kevin-hoffman-with-me.jpg)
