---
title: "kube-proxy"
layout: "post"
---

## Iptables示例

```
#    Iptables –t nat –L –n
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination         
KUBE-SERVICES  all  --  anywhere             anywhere             /* kubernetes service portals */ ← 1
DOCKER     all  --  anywhere             anywhere             ADDRTYPE match dst-type LOCAL

Chain KUBE-SEP-G3MLSGWVLUPEIMXS (1 references) ← 4
target     prot opt source               destination         
MARK       all  --  172.16.16.2          anywhere             /* default/webpod-service: */ MARK set 0x4d415351
DNAT       tcp  --  anywhere             anywhere             /* default/webpod-service: */ tcp to:172.16.16.2:80

Chain KUBE-SEP-OUBP2X5UG3G4CYYB (1 references)
target     prot opt source               destination         
MARK       all  --  192.168.190.128      anywhere             /* default/kubernetes: */ MARK set 0x4d415351
DNAT       tcp  --  anywhere             anywhere             /* default/kubernetes: */ tcp to:192.168.190.128:6443

Chain KUBE-SEP-PXEMGP3B44XONJEO (1 references) ← 4
target     prot opt source               destination         
MARK       all  --  172.16.91.2          anywhere             /* default/webpod-service: */ MARK set 0x4d415351
DNAT       tcp  --  anywhere             anywhere             /* default/webpod-service: */ tcp to:172.16.91.2:80

Chain KUBE-SERVICES (2 references) ← 2
target     prot opt source               destination         
KUBE-SVC-N4RX4VPNP4ATLCGG  tcp  --  anywhere             192.168.3.237        /* default/webpod-service: cluster IP */ tcp dpt:http
KUBE-SVC-6N4SJQIF3IX3FORG  tcp  --  anywhere             192.168.3.1          /* default/kubernetes: cluster IP */ tcp dpt:https
KUBE-NODEPORTS  all  --  anywhere             anywhere             /* kubernetes service nodeports; NOTE: this must be the last rule in this chain */ ADDRTYPE match dst-type LOCAL

Chain KUBE-SVC-6N4SJQIF3IX3FORG (1 references)
target     prot opt source               destination         
KUBE-SEP-OUBP2X5UG3G4CYYB  all  --  anywhere             anywhere             /* default/kubernetes: */

Chain KUBE-SVC-N4RX4VPNP4ATLCGG (1 references) ← 3
target     prot opt source               destination         
KUBE-SEP-G3MLSGWVLUPEIMXS  all  --  anywhere             anywhere             /* default/webpod-service: */ statistic mode random probability 0.50000000000
KUBE-SEP-PXEMGP3B44XONJEO  all  --  anywhere             anywhere             /* default/webpod-service: */
```

