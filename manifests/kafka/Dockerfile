FROM sz-pg-oam-docker-hub-001.tendcloud.com/library/jdk:8u45
ENV KAFKA_USER=kafka \
KAFKA_DATA_DIR=/var/lib/kafka/data \
JAVA_HOME=/usr/local/java \
KAFKA_HOME=/opt/kafka \
PATH=$PATH:/opt/kafka/bin

ARG KAFKA_DIST=kafka_2.10-0.8.2.1
RUN set -x \
    && yum install -y wget tar \
    && wget -q "http://repo.tendcloud.com/td-configuration/deploy/kafka/$KAFKA_DIST.tgz" \
    && export GNUPGHOME="$(mktemp -d)" \
    && tar -xzf "$KAFKA_DIST.tgz" -C /opt \
    && rm -r "$GNUPGHOME" "$KAFKA_DIST.tgz"

COPY log4j.properties /opt/$KAFKA_DIST/config/

RUN set -x \
    && ln -s /opt/$KAFKA_DIST $KAFKA_HOME \
    && useradd $KAFKA_USER \
    && [ `id -u $KAFKA_USER` -eq 1000 ] \
    && [ `id -g $KAFKA_USER` -eq 1000 ] \
    && mkdir -p $KAFKA_DATA_DIR \
    && chown -R "$KAFKA_USER:$KAFKA_USER"  /opt/$KAFKA_DIST \
    && chown -R "$KAFKA_USER:$KAFKA_USER"  $KAFKA_DATA_DIR

COPY kafkaGenConfig.sh /opt/$KAFKA_DIST/bin
