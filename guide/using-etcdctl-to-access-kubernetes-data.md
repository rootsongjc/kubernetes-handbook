# 使用etcdctl访问kuberentes数据

Kubenretes1.6中使用etcd V3版本的API，使用`etcdctl`直接`ls`的话只能看到`/kube-centos`一个路径。需要在命令前加上`ETCDCTL_API=3`这个环境变量才能看到kuberentes在etcd中保存的数据。

```bash
ETCDCTL_API=3 etcdctl get /registry/namespaces/default -w=json|python -m json.tool
```

- `-w`指定输出格式

将得到这样的json的结果：

```json
{
    "count": 1,
    "header": {
        "cluster_id": 12091028579527406772,
        "member_id": 16557816780141026208,
        "raft_term": 36,
        "revision": 29253467
    },
    "kvs": [
        {
            "create_revision": 5,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMvZGVmYXVsdA==",
            "mod_revision": 5,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEmIKSAoHZGVmYXVsdBIAGgAiACokZTU2YzMzMDgtMWVhOC0xMWU3LThjZDctZjRlOWQ0OWY4ZWQwMgA4AEILCIn4sscFEKOg9xd6ABIMCgprdWJlcm5ldGVzGggKBkFjdGl2ZRoAIgA=",
            "version": 1
        }
    ]
}
```

使用`--prefix`可以看到所有的子目录，如查看集群中的namespace：

```bash
ETCDCTL_API=3 etcdctl get /registry/namespaces --prefix -w=json|python -m json.tool
```

输出结果中可以看到所有的namespace。

```bash
{
    "count": 8,
    "header": {
        "cluster_id": 12091028579527406772,
        "member_id": 16557816780141026208,
        "raft_term": 36,
        "revision": 29253722
    },
    "kvs": [
        {
            "create_revision": 24310883,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMvYXV0b21vZGVs",
            "mod_revision": 24310883,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEmQKSgoJYXV0b21vZGVsEgAaACIAKiQ1MjczOTU1ZC1iMzEyLTExZTctOTcwYy1mNGU5ZDQ5ZjhlZDAyADgAQgsI7fSWzwUQ6Jv1Z3oAEgwKCmt1YmVybmV0ZXMaCAoGQWN0aXZlGgAiAA==",
            "version": 1
        },
        {
            "create_revision": 21387676,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMvYnJhbmQ=",
            "mod_revision": 21387676,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEmEKRwoFYnJhbmQSABoAIgAqJGNkZmQ1Y2NmLWExYzktMTFlNy05NzBjLWY0ZTlkNDlmOGVkMDIAOABCDAjR9qLOBRDYn83XAXoAEgwKCmt1YmVybmV0ZXMaCAoGQWN0aXZlGgAiAA==",
            "version": 1
        },
        {
            "create_revision": 5,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMvZGVmYXVsdA==",
            "mod_revision": 5,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEmIKSAoHZGVmYXVsdBIAGgAiACokZTU2YzMzMDgtMWVhOC0xMWU3LThjZDctZjRlOWQ0OWY4ZWQwMgA4AEILCIn4sscFEKOg9xd6ABIMCgprdWJlcm5ldGVzGggKBkFjdGl2ZRoAIgA=",
            "version": 1
        },
        {
            "create_revision": 18504694,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMvZGV2",
            "mod_revision": 24310213,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEmwKUgoDZGV2EgAaACIAKiQyOGRlMGVjNS04ZTEzLTExZTctOTcwYy1mNGU5ZDQ5ZjhlZDAyADgAQgwI89CezQUQ0v2fuQNaCwoEbmFtZRIDZGV2egASDAoKa3ViZXJuZXRlcxoICgZBY3RpdmUaACIA",
            "version": 4
        },
        {
            "create_revision": 10,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMva3ViZS1wdWJsaWM=",
            "mod_revision": 10,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEmcKTQoLa3ViZS1wdWJsaWMSABoAIgAqJGU1ZjhkY2I1LTFlYTgtMTFlNy04Y2Q3LWY0ZTlkNDlmOGVkMDIAOABCDAiJ+LLHBRDdrsDPA3oAEgwKCmt1YmVybmV0ZXMaCAoGQWN0aXZlGgAiAA==",
            "version": 1
        },
        {
            "create_revision": 2,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMva3ViZS1zeXN0ZW0=",
            "mod_revision": 2,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEmYKTAoLa3ViZS1zeXN0ZW0SABoAIgAqJGU1NmFhMDVkLTFlYTgtMTFlNy04Y2Q3LWY0ZTlkNDlmOGVkMDIAOABCCwiJ+LLHBRDoq9ASegASDAoKa3ViZXJuZXRlcxoICgZBY3RpdmUaACIA",
            "version": 1
        },
        {
            "create_revision": 3774247,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMvc3BhcmstY2x1c3Rlcg==",
            "mod_revision": 3774247,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEoABCmYKDXNwYXJrLWNsdXN0ZXISABoAIgAqJDMyNjY3ZDVjLTM0YWMtMTFlNy1iZmJkLThhZjFlM2E3YzViZDIAOABCDAiA1cbIBRDU3YuAAVoVCgRuYW1lEg1zcGFyay1jbHVzdGVyegASDAoKa3ViZXJuZXRlcxoICgZBY3RpdmUaACIA",
            "version": 1
        },
        {
            "create_revision": 15212191,
            "key": "L3JlZ2lzdHJ5L25hbWVzcGFjZXMveWFybi1jbHVzdGVy",
            "mod_revision": 15212191,
            "value": "azhzAAoPCgJ2MRIJTmFtZXNwYWNlEn0KYwoMeWFybi1jbHVzdGVyEgAaACIAKiQ2YWNhNjk1Yi03N2Y5LTExZTctYmZiZC04YWYxZTNhN2M1YmQyADgAQgsI1qiKzAUQkoqxDloUCgRuYW1lEgx5YXJuLWNsdXN0ZXJ6ABIMCgprdWJlcm5ldGVzGggKBkFjdGl2ZRoAIgA=",
            "version": 1
        }
    ]
}
```

key的值是经过base64编码，需要解码后才能看到实际值，如：

```bash
$ echo L3JlZ2lzdHJ5L25hbWVzcGFjZXMvYXV0b21vZGVs|base64 -d
/registry/namespaces/automodel
```

## 参考

- [etcd中文文档](https://github.com/doczhcn/etcd)
- [etcd官方文档](https://coreos.com/etcd/docs/latest/)