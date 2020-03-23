BOOK_NAME := kubernetes-handbook
BOOK_OUTPUT := _book
image := jimmysong/gitbook-builder:2019-07-31
docker := docker run -t -i --sig-proxy=true --rm -v $(shell pwd):/gitbook -w /gitbook -p 4000:4000 $(image)

.PHONY: build
build:
	@$(docker) scripts/build-gitbook.sh

.PHONY: lint
lint:
	@$(docker) scripts/lint-gitbook.sh
	htmlproofer --url-ignore "/localhost/,/172.17.8.101/,/172.20.0.113/,/slideshare.net/,/grpc.io/,/kiali.io/,/condiut.io/,/twitter.com/,/facebook.com/,/medium.com/,/google.com/,/jimmysong.io/,/openfaas.com/,/linkerd.io/,/layer5.io/,/thenewstack.io/,/blog.envoyproxy.io/,/blog.openebs.io/,/k8smeetup.github.io/,/blog.heptio.com/,/apigee.com/,/speakerdeck.com/,/download.svcat.sh/,/blog.fabric8.io/,/blog.heptio.com/,/blog.containership.io/,/blog.mobyproject.org/,/blog.spinnaker.io/,/coscale.com/,/zh.wikipedia.org/,/labs.play-with-k8s.com/,/cilium.readthedocs.io/,/azure.microsoft.com/,/storageos.com/,/openid.net/,/prometheus.io/,/coreos.com/,/openwhisk.incubator.apache.org/" $(BOOK_OUTPUT)

.PHONY: install
install:
	@$(docker) gitbook install

.PHONY: serve
serve:
	@$(docker) gitbook serve . $(BOOK_OUTPUT)

.PHONY: epub
epub:
	@$(docker) gitbook epub . $(BOOK_NAME).epub

.PHONY: pdf
pdf:
	@$(docker) gitbook pdf . $(BOOK_NAME).pdf

.PHONY: mobi
mobi:
	@$(docker) gitbook mobi . $(BOOK_NAME).mobi

.PHONY: clean
clean:
	rm -rf $(BOOK_OUTPUT)

.PHONY: help
help:
	@echo "Help for make"
	@echo "make          - Build the book"
	@echo "make build    - Build the book"
	@echo "make serve    - Serving the book on localhost:4000"
	@echo "make install  - Install gitbook and plugins"
	@echo "make epub     - Build epub book"
	@echo "make pdf      - Build pdf book"
	@echo "make clean    - Remove generated files"
