FROM alpine:3.9

MAINTAINER Jimmy Song <rootsongjc@gmail.com>

RUN apk add --no-cache bash git curl jq tar libc6-compat g++

RUN apk add --no-cache nodejs-current-npm && npm install -g markdown-spellcheck webpack webpack-cli

RUN apk add --no-cache ruby ruby-dev ruby-rdoc && gem install mdl

# Install html-proofer
RUN echo 'gem: --no-document' >> /etc/gemrc

RUN apk add --no-cache --virtual build-dependencies \
  build-base \
  libcurl \
  libxml2-dev \
  libxslt-dev && \
  apk add --no-cache --update build-base libffi-dev && \
  gem install nokogiri -- --use-system-libraries && \
  gem install ffi && \
  gem install etc && \
  gem install bigdecimal && \
  gem install html-proofer --no-ri --no-rdoc && \
  apk del build-dependencies && \
  apk add --no-cache bash git libcurl libxml2 libxslt && \
  rm -rf /var/cache/apk/* && \
  rm -rf /root/.gem/* && \
  rm -rf /usr/local/bundle/cache/*.gem && \
  rm -rf /usr/lib/ruby/gems/*/cache/*.gem

# Install gitbook
RUN npm install gitbook-cli -g && \
  gitbook -V
