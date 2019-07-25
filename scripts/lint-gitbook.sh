#!/bin/bash
./scripts/build-gitbook.sh
echo -ne "mdspell "
mdspell --version
echo -ne "mdl "
mdl --version
htmlproofer --version
htmlproofer --url-ignore "/localhost/,/172.17.8.101/,/172.20.0.113/,/slideshare.net/,/grpc.io/,/kiali.io/,/condiut.io/,/twitter.com/,/facebook.com/,/medium.com/,/google.com/,/jimmysong.io/,/openfaas.com/,/linkerd.io/,/layer5.io/,/thenewstack.io/,/blog.envoyproxy.io/,/blog.openebs.io/,/k8smeetup.github.io/,/blog.heptio.com/,/apigee.com/,/speakerdeck.com/,/download.svcat.sh/,/blog.fabric8.io/,/blog.heptio.com/,/blog.containership.io/,/blog.mobyproject.org/,/blog.spinnaker.io/,/coscale.com/,/zh.wikipedia.org/,/labs.play-with-k8s.com/,/cilium.readthedocs.io/,/azure.microsoft.com/,/storageos.com/,/openid.net/,/prometheus.io/,/coreos.com/,/openwhisk.incubator.apache.org/" _book
