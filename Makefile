BOOK_NAME := kubernetes-handbook
BOOK_OUTPUT := _book

.PHONY: build
build:
	gitbook build . $(BOOK_OUTPUT)
	cp images/apple-touch-icon-precomposed-152.png $(BOOK_OUTPUT)/gitbook/images

.PHONY: lint
lint:
	htmlproofer --url-ignore "/localhost/,/172.17.8.101/,/172.20.0.113/,/slideshare.net/,/grpc.io/,/kiali.io/,/condiut.io/,/twitter.com/,/facebook.com/,/medium.com/,/google.com/,/jimmysong.io/,/openfaas.com/,/linkerd.io/,/layer5.io/,/thenewstack.io/,/blog.envoyproxy.io/,/blog.openebs.io/,/k8smeetup.github.io/,/blog.heptio.com/,/apigee.com/,/speakerdeck.com/,/download.svcat.sh/,/blog.fabric8.io/,/blog.heptio.com/,/blog.containership.io/,/blog.mobyproject.org/,/blog.spinnaker.io/,/coscale.com/,/zh.wikipedia.org/" $(BOOK_OUTPUT)

.PHONY: serve
serve:
	gitbook serve . $(BOOK_OUTPUT)

.PHONY: epub
epub:
	gitbook epub . $(BOOK_NAME).epub

.PHONY: pdf
pdf:
	gitbook pdf . $(BOOK_NAME).pdf

.PHONY: mobi
mobi:
	gitbook mobi . $(BOOK_NAME).mobi

.PHONY: install
install:
	npm install gitbook-cli -g
	gitbook install
	gem install html-proofer

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
