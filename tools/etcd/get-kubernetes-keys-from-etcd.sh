#!/bin/bash
# Get kubernetes keys from etcd
export ETCDCTL_API=3
keys=`etcdctl get /registry --prefix -w json|python -m json.tool|grep key|cut -d ":" -f2|tr -d '"'|tr -d ","`
for x in $keys;do
  echo $x|base64 -d|sort
done
