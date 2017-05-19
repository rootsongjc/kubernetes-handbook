# Kubernetes ecosystem

![Cloude Native Landscape](../images/cloud-native-landscape.jpg)

* http://kubernetes.io/partners/
* K8s distributions and SaaS offerings
    - [http://openshift.com](http://openshift.com/)
    - https://tectonic.com/
    - http://rancher.com/kubernetes/
    - [https://www.infoq.com/news/2016/11/apprenda-kubernetes-ket](https://www.infoq.com/news/2016/11/apprenda-kubernetes-ket)
    - [https://github.com/samsung-cnct/kraken](https://github.com/samsung-cnct/kraken)
    - [https://www.mirantis.com/solutions/container-technologies/](https://www.mirantis.com/solutions/container-technologies/)
    - [https://www.ubuntu.com/cloud/kubernetes](https://www.ubuntu.com/cloud/kubernetes)
    - [https://platform9.com/products-2/kubernetes/](https://platform9.com/products-2/kubernetes/)
    - https://kubermatic.io/en/
    - https://stackpoint.io/#/
    - [http://gravitational.com/telekube/](http://gravitational.com/telekube/)
    - https://kcluster.io/
    - [http://www.stratoscale.com/products/kubernetes-as-a-service/](http://www.stratoscale.com/products/kubernetes-as-a-service/)
    - https://giantswarm.io/product/
    - [https://cloud.google.com/container-engine/](https://cloud.google.com/container-engine/)
    - [https://www.digitalocean.com/community/tutorials/an-introduction-to-kubernetes](https://www.digitalocean.com/community/tutorials/an-introduction-to-kubernetes)
    - [http://blog.kubernetes.io/2016/11/bringing-kubernetes-support-to-azure.html](http://blog.kubernetes.io/2016/11/bringing-kubernetes-support-to-azure.html)
    - [http://thenewstack.io/huawei-launches-kubernetes-based-container-engine/](http://thenewstack.io/huawei-launches-kubernetes-based-container-engine/)
    - [http://blogs.univa.com/2016/05/univa-announces-navops-command-for-managing-enterprise-container-workload-on-kubernetes-distributions/](http://blogs.univa.com/2016/05/univa-announces-navops-command-for-managing-enterprise-container-workload-on-kubernetes-distributions/)
    - https://supergiant.io/
    - https://diamanti.com/products/
    - [http://www.vmware.com/company/news/releases/vmw-newsfeed.VMware-Introduces-Kubernetes-as-a-Service-on-Photon-Platform.2104598.html](http://www.vmware.com/company/news/releases/vmw-newsfeed.VMware-Introduces-Kubernetes-as-a-Service-on-Photon-Platform.2104598.html)
    - http://mantl.io/
    - [https://github.com/hyperhq/hypernetes](https://github.com/hyperhq/hypernetes)
    - [https://github.com/vmturbo/kubernetes](https://github.com/vmturbo/kubernetes) 
    - [https://www.joyent.com/containerpilot](https://www.joyent.com/containerpilot)
* PaaS on Kubernetes
    - Openshift
    - Deis Workflow
    - Gondor/Kel
    - WSO2
    - Rancher
    - Kumoru
* Serverless implementations
    - Funktion
    - [Fission](https://github.com/platform9/fission)
    - Kubeless
    - OpenWhisk
    - Iron.io
* Application frameworks
    * [Spring Cloud](http://www.nicolaferraro.stfi.re/2016/10/23/hot-reconfiguration-of-microservices-on-kubernetes/)
* API Management
    - Apigee
    - [Kong](https://github.com/Mashape/kong-dist-kubernetes)
    - Apiman
* Data processing
    - Pachyderm
    - Heron
* Package managers
    * Helm
    * [KPM](https://github.com/coreos/kpm)
* Configuration
    - Kompose
    - Jsonnet
    - [Spread](https://redspread.com/)
    - [K8comp](https://github.com/cststack/k8comp)
    - [Ktmpl](https://github.com/InQuicker/ktmpl)
    - [Konfd](https://github.com/kelseyhightower/konfd)
    - [kenv](https://github.com/thisendout/kenv)
    - [kubediff](https://github.com/weaveworks/kubediff)
    - [Habitat](https://www.habitat.sh/docs/container-orchestration/)
    - [Puppet](https://forge.puppet.com/garethr/kubernetes/readme)
    - [Ansible](https://docs.ansible.com/ansible/kubernetes_module.html)
* Application deployment orchestration
    - [ElasticKube](https://elasticbox.com/kubernetes)
    - [AppController](https://github.com/Mirantis/k8s-AppController)
    - [Broadway](https://github.com/namely/broadway)
    - [Kb8or](https://github.com/UKHomeOffice/kb8or)
    - [IBM UrbanCode](https://developer.ibm.com/urbancode/plugin/kubernetes/)
    - [nulecule](https://github.com/projectatomic/nulecule)
    - [Deployment manager](https://cloud.google.com/deployment-manager/)
* API/CLI adaptors
    - [Kubebot](https://blog.harbur.io/introducing-kubebot-a-kubernetes-bot-for-slack/)
    - [StackStorm](https://github.com/StackStorm/st2)
    - [Kubefuse](https://opencredo.com/introducing-kubefuse-file-system-kubernetes/)
    - [Ksql](https://github.com/brendandburns/ksql)
    - [kubectld](https://github.com/rancher/kubectld)
* UIs / mobile apps
    * [Cabin](http://www.skippbox.com/announcing-cabin-the-first-mobile-app-for-kubernetes/)
    * [Cockpit](http://cockpit-project.org/guide/latest/feature-kubernetes.html)
* CI/CD
    * [Jenkins plugin](https://github.com/jenkinsci/kubernetes-pipeline-plugin)
    * Wercker
    * Shippable
    - GitLab
    - [cloudmunch](http://www.cloudmunch.com/continuous-delivery-for-kubernetes/)
    - [Kontinuous](https://github.com/AcalephStorage/kontinuous)
    - [Kit](https://invisionapp.github.io/kit/)
    - [Spinnaker](http://www.spinnaker.io/docs/kubernetes-source-to-prod)
* Developer platform
    * [Fabric8](https://fabric8.io/)
        * [Spring Cloud integration](https://github.com/fabric8io/spring-cloud-kubernetes)
    * [goPaddle](https://www.gopaddle.io/#/)
    * [VAMP](http://vamp.io/)
* Secret generation and management
    * [Vault controller](https://github.com/kelseyhightower/vault-controller)
    * [kube-lego](https://github.com/jetstack/kube-lego)
    * [k8sec](https://github.com/dtan4/k8sec)
* [Client libraries](https://github.com/kubernetes/community/blob/master/contributors/devel/client-libraries.md)
* Autoscaling
    * [Kapacitor](https://www.influxdata.com/kubernetes-monitoring-and-autoscaling-with-telegraf-and-kapacitor/)
* Monitoring
    * Sysdig
    * Datadog
    * Sematext
    * Prometheus
    * Snap
    - [Satellite](https://github.com/gravitational/satellite)
    - [Netsil](http://netsil.com/product/)
    - [Weave Scope](https://github.com/weaveworks/scope)
    - [AppFormix](http://www.appformix.com/solutions/appformix-for-kubernetes/)
* Logging
    * Sematext
    * [Sumo Logic](https://github.com/jdumars/sumokube)
* RPC
    * Grpc
    * [Micro](https://github.com/micro/kubernetes)
* Load balancing
    * Nginx Plus
    * Traefik
    * Service mesh
    * Envoy
    * Linkerd
    * Amalgam8
    * WeaveWorks
* Networking
    * WeaveWorks
    * Tigera
    * [OpenContrail](http://www.opencontrail.org/kubernetes-networking-with-opencontrail/)
    * Nuage
    * [Kuryr](https://github.com/openstack/kuryr-kubernetes)
    * [Contiv](http://contiv.github.io/)
* Storage
    * Flocker
    * [Portworx](https://portworx.com/products/)
    - REX-Ray
    - [Torus](https://coreos.com/blog/torus-distributed-storage-by-coreos.html)
    - Hedvig
    - [Quobyte](https://www.quobyte.com/containers)
    - [NetApp](https://netapp.github.io/blog/2016/05/11/netapp-persistent-storage-in-kubernetes-using-ontap-and-nfs/)
    - [Datera](http://www.storagereview.com/datera_s_elastic_data_fabric_integrates_with_kubernetes)
    - [Ceph](http://ceph.com/planet/bring-persistent-storage-for-your-containers-with-krbd-on-kubernetes/)
    - [Gluster](http://blog.gluster.org/2016/08/coming-soon-dynamic-provisioning-of-glusterfs-volumes-in-kubernetesopenshift/)
* Database/noSQL
    * [CockroachDB](https://www.cockroachlabs.com/docs/orchestrate-cockroachdb-with-kubernetes.html)
    - [Cassandra](http://blog.kubernetes.io/2016/07/thousand-instances-of-cassandra-using-kubernetes-pet-set.html) / [DataStax](http://www.datastax.com/dev/blog/scale-quickly-with-datastax-enterprise-on-google-container-engine)
    - [MongoDB](https://www.mongodb.com/blog/post/running-mongodb-as-a-microservice-with-docker-and-kubernetes)
    - [Hazelcast](https://blog.hazelcast.com/openshift/)
    - [Crate](https://crate.io/a/kubernetes-and-crate/)
    - [Vitess](http://vitess.io/getting-started/)
    - [Minio](https://blog.minio.io/storage-in-paas-minio-and-deis-7f9f604dedf2#.7rr6awv0j)
* Container runtimes
    * containerd
    * Rkt
    * CRI-O (OCI)
    * Hyper.sh/frakti
* Security
    * [Trireme](http://opensourceforu.com/2016/11/trireme-adds-production-scale-security-kubernetes)
    * [Aquasec](http://blog.aquasec.com/security-best-practices-for-kubernetes-deployment)
    * [Twistlock](https://www.twistlock.com/2015/11/10/twistlock-is-now-available-on-google-cloud-platform/)
* Appliances
    * Diamanti
    * Redapt
* Cloud providers
    * GKE/GCE
    * AWS
    * Azure
    * Digital Ocean
    * CenturyLink
    * Rackspace
    * VMWare
    * Openstack
    * Cloudstack
* Managed Kubernetes
    * Platform9
    * Gravitational
    * [KCluster](https://kcluster.io/)
* VMs on Kubernetes
    * Openstack
    * Redhat
* Other
    * [Netflix OSS](http://blog.christianposta.com/microservices/netflix-oss-or-kubernetes-how-about-both/)
    * [Kube-monkey](https://github.com/asobti/kube-monkey)
    * [Kubecraft](https://github.com/stevesloka/kubecraft)


