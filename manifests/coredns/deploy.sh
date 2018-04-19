#!/bin/bash

# Deploys CoreDNS to a cluster currently running Kube-DNS.

show_help () {
cat << USAGE
usage: $0 [ -r REVERSE-CIDR ] [ -i DNS-IP ] [ -d CLUSTER-DOMAIN ] [ -t YAML-TEMPLATE ]

    -r : Define a reverse zone for the given CIDR. You may specifcy this option more
         than once to add multiple reverse zones. If no reverse CIDRs are defined,
         then the default is to handle all reverse zones (i.e. in-addr.arpa and ip6.arpa)
    -i : Specify the cluster DNS IP address. If not specificed, the IP address of
         the existing "kube-dns" service is used, if present.
USAGE
exit 0
}

# Simple Defaults
CLUSTER_DOMAIN=cluster.local
YAML_TEMPLATE=`pwd`/coredns.yaml.sed


# Get Opts
while getopts "hr:i:d:t:" opt; do
    case "$opt" in
    h)  show_help
        ;;
    r)  REVERSE_CIDRS="$REVERSE_CIDRS $OPTARG"
        ;;
    i)  CLUSTER_DNS_IP=$OPTARG
        ;;
    d)  CLUSTER_DOMAIN=$OPTARG
        ;;
    t)  YAML_TEMPLATE=$OPTARG
        ;;
    esac
done

# Conditional Defaults
if [[ -z $REVERSE_CIDRS ]]; then
  REVERSE_CIDRS="in-addr.arpa ip6.arpa"
fi
if [[ -z $CLUSTER_DNS_IP ]]; then
  # Default IP to kube-dns IP
  CLUSTER_DNS_IP=$(kubectl get service --namespace kube-system kube-dns -o jsonpath="{.spec.clusterIP}")
  if [ $? -ne 0 ]; then
      >&2 echo "Error! The IP address for DNS service couldn't be determined automatically. Please specify the DNS-IP with the '-i' option."
      exit 2
  fi
fi

sed -e s/CLUSTER_DNS_IP/$CLUSTER_DNS_IP/g -e s/CLUSTER_DOMAIN/$CLUSTER_DOMAIN/g -e "s?REVERSE_CIDRS?$REVERSE_CIDRS?g" $YAML_TEMPLATE
