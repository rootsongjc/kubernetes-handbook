---
title: "L7 Traffic Path in Ambient Mesh"
description: "This article describes in detail the L7 traffic path in Ambient Mesh in both diagrammatic and hands-on form."
date: 2023-01-06T08:09:40+08:00
draft: false
tags: ["Istio","Ambient Mesh","ztunnel","Envoy"]
categories: ["Istio"]
type: "post"
image: "images/banner/ambient-l7.jpg"
---

[In my last blog](/en/blog/ambient-mesh-l4-traffic-path/), I introduced transparent traffic intercepting and L4 routing in Ambient mode. In this blog, I will show you how L7 traffic is routed.

The figure below shows the L7 network traffic path in ambient mode.

![Figure 1: L7 network traffic in ambient mesh](ambient-mesh-l7-traffic-path.svg)

> Note: The Waypoint proxy can be located on the same node as the application, and even all of the service and the Waypoint proxy can be on the same node. I draw them on three nodes for display purposes, but it has no significant impact on the actual traffic path, except that it is no longer sent to another node via eth0.

In the following section, we will explore the process in Figure 1 from a hands-on perspective.

## Environments for Waypoint Proxy

Let’s continue to view the environment description using the ambient mode Istio deployed in the previous blog. To illustrate the L7 network routing, we need to create a Gateway on top of this.

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: Gateway
metadata:
 name: productpage
 annotations:
   istio.io/service-account: bookinfo-productpage
spec:
 gatewayClassName: istio-mesh
EOF
```

After executing this command, a Waypoint proxy is created under the default namespace; in my environment, this pod is named `bookinfo-productpage-waypoint-proxy-6f88c55d59-4dzdx` and is specifically used to handle L7 traffic to the *productpage* service ( Service B), which I will call Waypoint proxy B.

The Waypoint proxy may be deployed in a different namespace, on a different node from the workload, or both. No matter where the Waypoint proxy is situated, the L7 traffic path is unaffected.

We will omit the sections of this blog dealing with intercepting inbound and outbound traffic because the way transparent traffic is handled in ambient mesh in L4 and L7 networks is similar. Details are available in the [prior blog](/en/blog/ambient-mesh-l4-traffic-path/).

We will start directly with the traffic intercepted at Ztunnel A and then forward it to Envoy port 15006.

## Outbound Traffic Routing on Ztunnel A

Use the following command to dump the Envoy proxy configuration on Ztunnel A:

```bash
kubectl exec -n istio-system ztunnel-hptxk -c istio-proxy -- curl "127.0.0.1:15000/config_dump?include_eds">ztunnel-a-all-include-eds.json
```

10.8.14.226 is the Cluster IP of the target service, and the service port is 9080. The traffic will be routed to the `spiffe://cluster.local/ns/default/sa/sleep_to_server_waypoint_proxy_spiffe://cluster.local/ns/default/sa/bookinfo-productpage` cluster. Let’s look at the configuration of that cluster.

{{<highlight json "linenos=table,hl_lines=2 12 18">}}
{
  "10.8.14.226": {
    "matcher": {
    "matcher_tree": {
      "input": {
      "name": "port",
      "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.matching.common_inputs.network.v3.DestinationPortInput"
      }
      },
      "exact_match_map": {
      "map": {
        "9080": {
        "action": {
          "name": "spiffe://cluster.local/ns/default/sa/sleep_to_server_waypoint_proxy_spiffe://cluster.local/ns/default/sa/bookinfo-productpage",
          "typed_config": {
          "@type": "type.googleapis.com/google.protobuf.StringValue",
          "value": "spiffe://cluster.local/ns/default/sa/sleep_to_server_waypoint_proxy_spiffe://cluster.local/ns/default/sa/bookinfo-productpage"
          }
        }
        }
      }
      }
    }
    }
  }
}
{{</highlight>}}

`10.8.14.226` is the Cluster IP of the target service, and the service port is 9080. The traffic will be routed to the `spiffe://cluster.local/ns/default/sa/sleep_to_server_waypoint_proxy_spiffe://cluster.local/ns/default/sa/bookinfo-productpage` cluster. Let’s look at the configuration of that cluster.

{{<highlight json "linenos=table,hl_lines=6">}}
{
 "version_info": "2022-11-17T03:27:45Z/82",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "spiffe://cluster.local/ns/default/sa/sleep_to_server_waypoint_proxy_spiffe://cluster.local/ns/default/sa/bookinfo-productpage",
  "type": "EDS",
  "eds_cluster_config": {
   "eds_config": {
    "ads": {},
    "initial_fetch_timeout": "0s",
    "resource_api_version": "V3"
   }
  },
  /* omit */
}
{{</highlight>}}

The cluster is discovered using the EDS service. To view the EDS information for this cluster:

{{<highlight json "linenos=table,hl_lines=11 12">}}
{ 
 "@type": "type.googleapis.com/envoy.config.endpoint.v3.ClusterLoadAssignment",
 "endpoints": [
  {
   "locality": {},
   "lb_endpoints": [
    {
     "endpoint": {
      "address": {
       "socket_address": {
        "address": "10.4.3.14",
        "port_value": 15006
       }
      },
      "health_check_config": {}
     },
     "health_status": "HEALTHY",
     "load_balancing_weight": 1
    }
   ]
  }
 ],
 "policy": {
  "overprovisioning_factor": 140
 }
}
{{</highlight>}}

> Note: The output cluster_name field is still missing here. See the [GitHub issue](https://github.com/istio/istio/issues/42022).

Traffic is forwarded here directly to the Waypoint Proxy endpoint at `10.4.3.14:15006`.

## Traffic Routing Using Waypoint Proxy

Let’s dump the Envoy configuration into Waypoint Proxy B again.

```bash
kubectl exec -n default bookinfo-productpage-waypoint-proxy-6f88c55d59-4dzdx -c istio-proxy -- curl "127.0.0.1:15000/config_dump?include_eds">waypoint-a-all-include-eds.json
```

Look into the configuration of inbound_CONNECT_terminate listener:

{{<highlight json "linenos=table,hl_lines=7 10 11 39 44 58 62">}}
{
  "name": "inbound_CONNECT_terminate",
  "active_state": {
    "version_info": "2022-11-17T03:27:45Z/82",
    "listener": {
    "@type": "type.googleapis.com/envoy.config.listener.v3.Listener",
    "name": "inbound_CONNECT_terminate",
    "address": {
      "socket_address": {
      "address": "0.0.0.0",
      "port_value": 15006
      }
    },
    "filter_chains": [{
      "filters": [{
        "name": "capture_tls",
        "typed_config": {
        "@type": "type.googleapis.com/udpa.type.v1.TypedStruct",
        "type_url": "type.googleapis.com/istio.tls_passthrough.v1.CaptureTLS"
        }
      },
      {
        "name": "envoy.filters.network.http_connection_manager",
        "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager",
        "stat_prefix": "inbound_hcm",
        "route_config": {
          "name": "local_route",
          "virtual_hosts": [{
          "name": "connect",
          "domains": [
            "*"
          ],
          "routes": [{...},
            {
            "match": {
              "headers": [{
              "name": ":authority",
              "exact_match": "10.8.14.226:9080"
              }],
              "connect_matcher": {}
            },
            "route": {
              "cluster": "inbound-vip|9080|internal|productpage.default.svc.cluster.local",
              "upgrade_configs": [{
              "upgrade_type": "CONNECT",
              "connect_config": {}
              }]
            }
            }
          ]
          }],
          "validate_clusters": false
        },
        "http_filters": [...],
        "tracing": {...},
        "http2_protocol_options": {
          "allow_connect": true
        },
        "use_remote_address": false,
        "upgrade_configs": [{
          "upgrade_type": "CONNECT"
        }],
        "stream_idle_timeout": "0s",
        "normalize_path": true,
        "request_id_extension": {...},
        "path_with_escaped_slashes_action": "KEEP_UNCHANGED"
        }
      }
      ],
      "transport_socket": {...},
      "name": "inbound_CONNECT_terminate"
    }]
    },
    "last_updated": "2022-11-17T06:24:51.467Z"
  }
}
{{</highlight>}}

TCP traffic destined for `10.8.14.226:9080` will be forwarded to the `inbound-vip|9080|internal|productpage.default.svc.cluster.local` cluster, and the HTTP method will be changed to CONNECT. To view the configuration of this cluster.

{{<highlight json "linenos=table,hl_lines=6 37">}}
{
 "version_info": "2022-11-17T03:27:45Z/82",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "inbound-vip|9080|internal|productpage.default.svc.cluster.local",
  "type": "STATIC",
  "transport_socket": {
   "name": "envoy.transport_sockets.internal_upstream",
   "typed_config": {
    "@type": "type.googleapis.com/envoy.extensions.transport_sockets.internal_upstream.v3.InternalUpstreamTransport",
    "passthrough_metadata": [
     {
      "kind": {
       "cluster": {}
      },
      "name": "istio"
     }
    ],
    "transport_socket": {
     "name": "envoy.transport_sockets.raw_buffer",
     "typed_config": {
      "@type": "type.googleapis.com/envoy.extensions.transport_sockets.raw_buffer.v3.RawBuffer"
     }
    }
   }
  },
  "common_lb_config": {},
  "load_assignment": {
   "cluster_name": "inbound-vip|9080|internal|productpage.default.svc.cluster.local",
   "endpoints": [
    {
     "lb_endpoints": [
      {
       "endpoint": {
        "address": {
         "envoy_internal_address": {
          "server_listener_name": "inbound-vip|9080||productpage.default.svc.cluster.local"
         }
        }
       }
      }
     ]
    }
   ]
  }
 },
 "last_updated": "2022-11-17T03:27:46.137Z"
}
{{</highlight>}}

The endpoint of the cluster is an Envoy internal listener `inbound-vip|9080||productpage.default.svc.cluster.local`：

{{<highlight json "linenos=table,hl_lines=21-47 73-80">}}
{
 "name": "inbound-vip|9080||productpage.default.svc.cluster.local",
 "active_state": {
  "version_info": "2022-11-17T03:27:45Z/82",
  "listener": {
   "@type": "type.googleapis.com/envoy.config.listener.v3.Listener",
   "name": "inbound-vip|9080||productpage.default.svc.cluster.local",
   "filter_chains": [{
    "filters": [{
      "name": "restore_tls",
      "typed_config": {
       "@type": "type.googleapis.com/udpa.type.v1.TypedStruct",
       "type_url": "type.googleapis.com/istio.tls_passthrough.v1.RestoreTLS"
      }
     },
     {
      "name": "envoy.filters.network.http_connection_manager",
      "typed_config": {
       "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager",
       "stat_prefix": "inbound_0.0.0.0_9080",
       "route_config": {
        "name": "inbound-vip|9080|http|productpage.default.svc.cluster.local",
        "virtual_hosts": [{
         "name": "inbound|http|9080",
         "domains": [
          "*"
         ],
         "routes": [{
          "match": {
           "prefix": "/"
          },
          "route": {
           "cluster": "inbound-vip|9080|http|productpage.default.svc.cluster.local",
           "timeout": "0s",
           "max_stream_duration": {
            "max_stream_duration": "0s",
            "grpc_timeout_header_max": "0s"
           }
          },
          "decorator": {
           "operation": ":9080/*"
          },
          "name": "default"
         }]
        }],
        "validate_clusters": false
       }
      },
      "server_name": "istio-envoy",
      "use_remote_address": false,
      "forward_client_cert_details": "APPEND_FORWARD",
      "set_current_client_cert_details": {
       "subject": true,
       "dns": true,
       "uri": true
      },
      "upgrade_configs": [{
       "upgrade_type": "websocket"
      }],
      "stream_idle_timeout": "0s",
      "normalize_path": true,
      "request_id_extension": {
       "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.request_id.uuid.v3.UuidRequestIdConfig",
        "use_request_id_for_trace_sampling": true
       }
      },
      "path_with_escaped_slashes_action": "KEEP_UNCHANGED"
     }
    ],
    "name": "inbound-vip|9080||productpage.default.svc.cluster.local-http"
   }],
   "listener_filters": [{
     "name": "set_dst_address",
     "typed_config": {
      "@type": "type.googleapis.com/xds.type.v3.TypedStruct",
      "type_url": "type.googleapis.com/istio.set_internal_dst_address.v1.Config",
      "value": {}
     }
    },
    {
     "name": "envoy.filters.listener.metadata_to_peer_node",
     "typed_config": {
      "@type": "type.googleapis.com/udpa.type.v1.TypedStruct",
      "type_url": "type.googleapis.com/istio.telemetry.metadatatopeernode.v1.Config"
     }
    }
   ],
   "traffic_direction": "INBOUND",
   "internal_listener": {}
  },
  "last_updated": "2022-11-17T03:27:46.300Z"
 }
}
{{</highlight>}}

The packets will be forwarded to the cluster `inbound-vip|9080|http|productpage.default.svc.cluster.local`:

{{<highlight json "linenos=table,hl_lines=6">}}
{
 "version_info": "2022-11-17T03:27:45Z/82",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "inbound-vip|9080|http|productpage.default.svc.cluster.local",
  "type": "EDS",
  "eds_cluster_config": {
   "eds_config": {
    "ads": {},
    "initial_fetch_timeout": "0s",
    "resource_api_version": "V3"
   },
   "service_name": "inbound-vip|9080|http|productpage.default.svc.cluster.local"
  },
  "transport_socket": {
   "name": "envoy.transport_sockets.internal_upstream",
   "typed_config": {
    "@type": "type.googleapis.com/envoy.extensions.transport_sockets.internal_upstream.v3.InternalUpstreamTransport",
    "transport_socket": {
     "name": "envoy.transport_sockets.raw_buffer",
     "typed_config": {
      "@type": "type.googleapis.com/envoy.extensions.transport_sockets.raw_buffer.v3.RawBuffer"
     }
    }
   }
  },
  "metadata": {
   "filter_metadata": {
    "istio": {
     "services": [{
      "namespace": "default",
      "name": "productpage",
      "host": "productpage.default.svc.cluster.local"
     }]
    }
   }
  },
  "common_lb_config": {}
 },
 "last_updated": "2022-11-17T03:27:46.138Z"
}
{{</highlight>}}

The cluster type is EDS, check the Endpoint configuration:

{{<highlight json "linenos=table,hl_lines=14">}}
{
 "endpoint_config": {
  "@type": "type.googleapis.com/envoy.config.endpoint.v3.ClusterLoadAssignment",
  "cluster_name": "inbound-vip|9080|http|productpage.default.svc.cluster.local",
  "endpoints": [{
   "locality": {
    "region": "us-west2",
    "zone": "us-west2-a"
   },
   "lb_endpoints": [{
    "endpoint": {
     "address": {
      "envoy_internal_address": {
       "server_listener_name": "inbound-pod|9080||10.4.0.5"
      }
     },
     "health_check_config": {}
    },
    "health_status": "HEALTHY",
    "metadata": {
     "filter_metadata": {
      "istio": {
       "workload": "productpage-v1;default;productpage;v1;Kubernetes"
      }
     }
    },
    "load_balancing_weight": 1
   }]
  }],
  "policy": {
   "overprovisioning_factor": 140
  }
 }
}
{{</highlight>}}

The packets will be forwarded to the listener `inbound-pod|9080||10.4.0.5` and `inbound-pod|9080||10.4.0.5` cluster

{{<highlight json "linenos=table,hl_lines=33">}}

{
 "name": "inbound-pod|9080||10.4.0.5",
 "active_state": {
  "version_info": "2022-11-17T03:27:45Z/82",
  "listener": {
   "@type": "type.googleapis.com/envoy.config.listener.v3.Listener",
   "name": "inbound-pod|9080||10.4.0.5",
   "filter_chains": [{
    "filters": [{
      "name": "restore_tls",
      "typed_config": {
       "@type": "type.googleapis.com/udpa.type.v1.TypedStruct",
       "type_url": "type.googleapis.com/istio.tls_passthrough.v1.RestoreTLS"
      }
     },
     {
      "name": "envoy.filters.network.http_connection_manager",
      "typed_config": {
       "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager",
       "stat_prefix": "inbound_0.0.0.0_9080",
       "route_config": {
        "name": "inbound-pod|9080||10.4.0.5",
        "virtual_hosts": [{
         "name": "inbound|http|9080",
         "domains": [
          "*"
         ],
         "routes": [{
          "match": {
           "prefix": "/"
          },
          "route": {
           "cluster": "inbound-pod|9080||10.4.0.5",
           "timeout": "0s",
           "max_stream_duration": {
            "max_stream_duration": "0s",
            "grpc_timeout_header_max": "0s"
           }
          },
          "decorator": {
           "operation": ":9080/*"
          },
          "name": "default"
         }]
        }],
        "validate_clusters": false
       },
       "http_filters": [{
        "name": "envoy.filters.http.rbac",
        "typed_config": {
         "@type": "type.googleapis.com/envoy.extensions.filters.http.rbac.v3.RBAC",
         "rules": {
          "policies": {
           "ns[default]-policy[productpage-viewer]-rule[0]": {
            "permissions": [{
             "and_rules": {
              "rules": [{
               "any": true
              }]
             }
            }],
            "principals": [{
             "and_ids": {
              "ids": [{
               "or_ids": {
                "ids": [{
                  "authenticated": {
                   "principal_name": {
                    "exact": "spiffe://cluster.local/ns/default/sa/sleep"
                   }
                  }
                 },
                 {
                  "authenticated": {
                   "principal_name": {
                    "exact": "spiffe://cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account"
                   }
                  }
                 }
                ]
               }
              }]
             }
            }]
           }
          }
         },
         "shadow_rules_stat_prefix": "istio_dry_run_allow_"
        }
       }],
       "server_name": "istio-envoy",
       "use_remote_address": false,
       "forward_client_cert_details": "APPEND_FORWARD",
       "set_current_client_cert_details": {
        "subject": true,
        "dns": true,
        "uri": true
       },
       "upgrade_configs": [{
        "upgrade_type": "websocket"
       }],
       "stream_idle_timeout": "0s",
       "normalize_path": true,
       "request_id_extension": {
        "typed_config": {
         "@type": "type.googleapis.com/envoy.extensions.request_id.uuid.v3.UuidRequestIdConfig",
         "use_request_id_for_trace_sampling": true
        }
       },
       "path_with_escaped_slashes_action": "KEEP_UNCHANGED"
      }
     }
    ],
    "name": "inbound-pod|9080||10.4.0.5-http"
   }],
   "listener_filters": [{
    "name": "set_dst_address",
    "typed_config": {
     "@type": "type.googleapis.com/xds.type.v3.TypedStruct",
     "type_url": "type.googleapis.com/istio.set_internal_dst_address.v1.Config",
     "value": {}
    }
   }],
   "traffic_direction": "INBOUND",
   "internal_listener": {}
  },
  "last_updated": "2022-11-17T03:27:46.339Z"
 }
}

{{</highlight>}}

Packets are forwarded to the `inbound-pod|9080||10.4.0.5 cluster`:

{{<highlight json "linenos=table,hl_lines=6 43 48-55">}}
{
 "version_info": "2022-11-17T03:27:45Z/82",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "inbound-pod|9080||10.4.0.5",
  "type": "STATIC",
  "transport_socket": {
   "name": "envoy.transport_sockets.internal_upstream",
   "typed_config": {
    "@type": "type.googleapis.com/envoy.extensions.transport_sockets.internal_upstream.v3.InternalUpstreamTransport",
    "passthrough_metadata": [
     {
      "kind": {
       "host": {}
      },
      "name": "tunnel"
     },
     {
      "kind": {
       "host": {}
      },
      "name": "istio"
     }
    ],
    "transport_socket": {
     "name": "envoy.transport_sockets.raw_buffer",
     "typed_config": {
      "@type": "type.googleapis.com/envoy.extensions.transport_sockets.raw_buffer.v3.RawBuffer"
     }
    }
   }
  },
  "common_lb_config": {},
  "load_assignment": {
   "cluster_name": "inbound-pod|9080||10.4.0.5",
   "endpoints": [
    {
     "lb_endpoints": [
      {
       "endpoint": {
        "address": {
         "envoy_internal_address": {
          "server_listener_name": "inbound_CONNECT_originate",
          "endpoint_id": "10.4.0.5:9080"
         }
        }
       },
       "metadata": {
        "filter_metadata": {
         "tunnel": {
          "destination": "10.4.0.5:9080",
          "address": "10.4.0.5:15008"
         }
        }
       }
      }
     ]
    }
   ]
  }
 },
 "last_updated": "2022-11-17T03:27:46.139Z"
}
{{</highlight>}}

The cluster is of type STATIC, which contains the HBONE tunnel configuration (HTTP/2 CONNECT address is `10.4.0.15008`), and the endpoint is the Envoy internal listener `inbound_CONNECT_originate`:

{{<highlight json "linenos=table,hl_lines=16-27 33 36">}}
{
 "name": "inbound_CONNECT_originate",
 "active_state": {
  "version_info": "2022-11-17T03:27:45Z/82",
  "listener": {
   "@type": "type.googleapis.com/envoy.config.listener.v3.Listener",
   "name": "inbound_CONNECT_originate",
   "filter_chains": [
    {
     "filters": [
      {
       "name": "envoy.filters.network.tcp_proxy",
       "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.filters.network.tcp_proxy.v3.TcpProxy",
        "stat_prefix": "inbound_CONNECT_originate",
        "cluster": "inbound_CONNECT_originate",
        "tunneling_config": {
         "hostname": "%DYNAMIC_METADATA(tunnel:destination)%",
         "headers_to_add": [
          {
           "header": {
            "key": "x-envoy-original-dst-host",
            "value": "%DYNAMIC_METADATA([\"tunnel\", \"destination\"])%"
           }
          }
         ]
        }
       }
      }
     ]
    }
   ],
   "use_original_dst": false,
   "listener_filters": [
    {
     "name": "set_dst_address",
     "typed_config": {
      "@type": "type.googleapis.com/xds.type.v3.TypedStruct",
      "type_url": "type.googleapis.com/istio.set_internal_dst_address.v1.Config",
      "value": {}
     }
    }
   ],
   "internal_listener": {}
  },
  "last_updated": "2022-11-17T03:27:46.339Z"
 }
}
{{</highlight>}}

Description:

- `set_dst_address` in `listener_filters` sets the destination address to `10.4.0.5.15008`.
- A new header is added to the tunnel: `x-envoy-original-dst-host`, which has the value `10.4.0.5:9080`.
- The endpoint of this cluster is the `inbound_CONNECT_originate` cluster.

Look into the *inbound_CONNECT_originate* cluster:

{{<highlight json "linenos=table,hl_lines=6">}}
{
 "version_info": "2022-11-17T03:27:45Z/82",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "inbound_CONNECT_originate",
  "type": "ORIGINAL_DST",
  "connect_timeout": "2s",
  "lb_policy": "CLUSTER_PROVIDED",
  "cleanup_interval": "60s",
  "transport_socket": {
   "name": "envoy.transport_sockets.tls",
   "typed_config": {
    "@type": "type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext",
    "common_tls_context": {
     "tls_params": {
      "tls_minimum_protocol_version": "TLSv1_3",
      "tls_maximum_protocol_version": "TLSv1_3"
     },
     "alpn_protocols": [
      "h2"
     ],
     "tls_certificate_sds_secret_configs": [
      {
       "name": "default",
       "sds_config": {
        "api_config_source": {
         "api_type": "GRPC",
         "grpc_services": [
          {
           "envoy_grpc": {
            "cluster_name": "sds-grpc"
           }
          }
         ],
         "set_node_on_first_message_only": true,
         "transport_api_version": "V3"
        },
        "initial_fetch_timeout": "0s",
        "resource_api_version": "V3"
       }
      }
     ],
     "combined_validation_context": {
      "default_validation_context": {
       "match_subject_alt_names": [
        {
         "prefix": "spiffe://cluster.local/"
        }
       ]
      },
      "validation_context_sds_secret_config": {
       "name": "ROOTCA",
       "sds_config": {
        "api_config_source": {
         "api_type": "GRPC",
         "grpc_services": [
          {
           "envoy_grpc": {
            "cluster_name": "sds-grpc"
           }
          }
         ],
         "set_node_on_first_message_only": true,
         "transport_api_version": "V3"
        },
        "initial_fetch_timeout": "0s",
        "resource_api_version": "V3"
       }
      }
     }
    }
   }
  },
  "typed_extension_protocol_options": {
   "envoy.extensions.upstreams.http.v3.HttpProtocolOptions": {
    "@type": "type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions",
    "explicit_http_config": {
     "http2_protocol_options": {
      "allow_connect": true
     }
    }
   }
  }
 },
 "last_updated": "2022-11-17T03:27:46.140Z"
}
{{</highlight>}}

This cluster, which is of type `ORIGINAL_DST`, creates a direct HBONE tunnel with the upstream in order to send packets to port 15008 on Pod B. The traffic intercepting and routing of the Ztunnel in Node B is the same as in L4, so I won’t go over it here.dsr5t

## Summary

L7 traffic routing is based on L4 with the addition of the Waypoint proxy, which is more complex to handle in Envoy. We can also create HPAs to scale it dynamically.

---

If you’re new to service mesh and Kubernetes security, we have a bunch of free online courses [available at Tetrate Academy](https://tetr8.io/academy) that will quickly get you up to speed with Istio and Envoy.

If you’re looking for a fast way to get to production with Istio, check out [Tetrate Istio Distribution (TID)](https://tetr8.io/tid) . TID is Tetrate’s hardened, fully upstream Istio distribution, with FIPS-verified builds and support available. It’s a great way to get started with Istio knowing you have a trusted distribution to begin with, have an expert team supporting you, and also have the option to get to FIPS compliance quickly if you need to.Once you have Istio up and running, you will probably need simpler ways to manage and secure your services beyond what’s available in Istio, that’s where Tetrate Service Bridge comes in. You can learn more about how Tetrate Service Bridge makes service mesh more secure, manageable, and resilient [here](https://tetr8.io/tsb) , or [contact us for a quick demo](https://tetr8.io/contact) .

*This blog was originally published at [tetrate.io](https://tetrate.io/blog/l7-traffic-path-in-ambient-mesh/).*
