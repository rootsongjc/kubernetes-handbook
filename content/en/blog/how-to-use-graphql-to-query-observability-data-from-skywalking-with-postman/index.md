---
title: "How to Use GraphQL to Query Observability Data from SkyWalking with Postman"
draft: false
date: 2023-07-20T16:27:49+08:00
description: "This article explains how to use GraphQL to query observability data from SkyWalking with Postman. It first introduces GraphQL and SkyWalking, then explains how to set up Postman to send GraphQL queries, and finally provides some example GraphQL queries that can be used to query observability data from SkyWalking."
tags: ["Istio","Argo","ArgoCD","Argo Rollouts","SkyWalking","GitOps"]
categories: ["Istio"]
type: "post"
image: "images/banner/graphql.jpg"
---

In this article, I will explain how to use [GraphQL](https://graphql.org/) to query data from [SkyWalking](https://skywalking.apache.org/) with [Postman](https://www.postman.com/). It includes steps to obtain the bearer token, construct a query to retrieve load metrics for a specific service, and use GraphQL introspection to see the schema of SkyWalking GraphQL APIs. The article also provides references for further information.

## What Is GraphQL?

GraphQL is a query language and runtime for APIs developed by Facebook. It provides a more efficient, powerful, and flexible alternative to traditional REST APIs by allowing clients to specify exactly what data they need and receive only that data in response. With GraphQL, clients can query multiple resources in a single request, reducing the number of roundtrips to the server and improving performance.

## What’s the Difference between GraphQL and REST APIs?

GraphQL allows clients to request only the data they need, while REST APIs require clients to retrieve everything in a resource regardless of whether they need it or not. Additionally, GraphQL allows clients to query multiple resources in a single request, making it more efficient and less chatty than REST APIs.

## How Do I Query Data from SkyWalking?

SkyWalking defines the communication protocol for the query stage. The SkyWalking native UI and CLI use this protocol to consistently fetch data from the backend, without needing to worry about backend updates.

There are two methods for querying metrics from SkyWalking:

1. [GraphQL APIs](https://skywalking.apache.org/docs/main/v9.4.0/en/api/query-protocol/)
2. [PromQL APIs](https://skywalking.apache.org/docs/main/v9.4.0/en/api/promql-service/)

This article provides a guide on how to use GraphQL to query metrics from SkyWalking. If you are interested in the PromQL APIs, you can refer to the article[ Build Grafana dashboards for Apache SkyWalking — Native PromQL Support](https://skywalking.apache.org/blog/2023-03-17-build-grafana-dashboards-for-apache-skywalking-native-promql-support/).Continuing with the following steps requires a TSB installation. If you don’t have one and still want to experience using GraphQL to query data in SkyWalking, you can use the free[ demo environment](https://skywalking.apache.org/) (username/password: skywalking/skywalking) provided by SkyWalking. Log in to the demo website and get a token for queries. Endpoint address for GraphQL queries is[ http://demo.skywalking.apache.org/graphql](http://demo.skywalking.apache.org/graphql). The steps to construct the query are the same as described below.

## Observe GraphQL Queries in TSB

Before we use Postman to construct our own GraphQL query, let’s first observe how TSB obtains data from SkyWalking.

1. Open Chrome DevTools and switch to the Network tab.
2. Visit the **Organization – Services** tab on the website.

Watch the network request list and right-click on the one of the graphql requests, like in the following image:

![Figure 1: Chrome DevTool](f1.jpg)

The curl commands you see will look like this. Execute the command in your terminal, and you will get a list of services managed by TSB from SkyWalking.

```bash
curl '<https://saturn.tetrate.work/ui/graphql>' \
  -H 'Accept-Language: en,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,zh-TW;q=0.6' \
  -H 'Cache-Control: no-cache' \
  -H 'Client-Timestamp: 1686104776136' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: ...' \
  -H 'Origin: <https://saturn.tetrate.work>' \
  -H 'Pragma: no-cache' \
  -H 'Referer: <https://saturn.tetrate.work/mp/services>' \
  -H 'Request-Id: ...' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' \
  -H 'X-Bridge-Csrf-Token: IOmJszLAqY3TRIUNhTuGu7vQgnfQY1FtgYFm+l/+Mu4EmVQU5T8EaQ7bngkCv4hQ12ZGids+I21pHMdepE9/qQ==' \
  -H 'X-Csrf-Token: xTbxZerD3t8N3PaS7nbjKCfxk1Q9dtvvrx4D+IJohHicb0VfB4iAZaP0zh1eXDWctQyCYZWaKLhAYT3M6Drk3A==' \
  -H 'accept: application/json' \
  -H 'sec-ch-ua: "Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --data-raw $'{"query":"query ServiceRegistryListMetrics(...)}' \
  --compressed
```

**Note:** *Some fields in the above example are too long and replaced with dots (…)*.

Next, I will guide you through constructing a query to retrieve the load metrics for a specific service.

## Obtain the Bearer Token

Firstly, you need to obtain the bearer of the website. Log in to TSB UI, click on the user button in the upper right corner, and then click “Show token information”. In the pop-up window, you will see the Bearer Token, as shown in the following image.

![Figure 2: Get the bearer token from the TSB UI](f2.jpg)

**Note:** The validity period of the bearer token is relatively short. When it expires, you need to log in to TSB again to obtain a new token.

We have already deployed the[ bookinfo application](https://istio.io/latest/docs/examples/bookinfo/) in advance and sent some test traffic. To query the load metrics of reviews using GraphQL in the Postman client, follow these steps:

1. Create a new GraphQL request and enter the request URL: `$TSB_ADDRESS/graphql`
2. Add the `Authorization` header with the value` Bearer $TOKEN`

Use GraphQL Introspection to see the schema of SkyWalking GraphQL APIs. Find and click the `readMetricsValues` item. You will see the variables on the right side. Fill in the `condition` and `duration` items, as shown in the following image.

![Figure 3: Postman query](f3.jpg)

The variables look like this:

```graphql
query ReadMetricsValues {
    readMetricsValues(condition: {
    name: "service_cpm", entity: {scope: Service, serviceName: "reviews", normal: true}
  }, duration: {
    start: "2023-06-05 0625",
    end: "2023-06-05 0627",
    step: MINUTE
  }) {
        label
        values {
            values {
                id
                value
            }
        }
    }
}
```

Click the **Query** button to get the result. It should look similar to this:

```json
{
    "data": {
        "readMetricsValues": {
            "label": null,
            "values": {
                "values": [
                    {
                        "id": "service_cpm_202306050625_cmV2aWV3cw==.1",
                        "value": 0
                    },
                    {
                        "id": "service_cpm_202306050626_cmV2aWV3cw==.1",
                        "value": 0
                    },
                    {
                        "id": "service_cpm_202306050627_cmV2aWV3cw==.1",
                        "value": 0
                    }
                ]
            }
        }
    }
}
```

The above is using the SkyWalking Demo environment to test GraphQL queries. GraphQL query support is also provided in TSE, and the endpoint address is `https://$TSB_SERVER/graphql`.

**Note:** The query endpoint here is different from what we see in DevTool. The GraphQL query endpoint specific to the TSB UI is `https://$TSB_SERVER/ui/graphql`.For details about the SkyWalking GraphQL Query Protocol, please refer to[ GitHub](https://github.com/apache/skywalking-query-protocol/tree/master).

## Summary

In this article, I have introduced how to use the GraphQL query protocol in Postman to query data in SkyWalking. You can construct your own query conditions based on the GraphQL schema of SkyWalking. This feature is also available in TSB/TSE.

## References

- https://github.com/apache/skywalking-query-protocol
- [SkyWalking Website](https://skywalking.apache.org/)

---

*This blog was originally published at [tetrate.io](https://tetrate.io/blog/what-is-tproxy-and-how-does-it-work/).*
