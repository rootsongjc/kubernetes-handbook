# NodeJS

[NodeJS](https://www.nodejs.org) The MEAN stack is MongoDB, Express.js, Angular, and Node.js. Because all components of the MEAN stack support programs written in JavaScript, MEAN applications can be written in one language for both server-side and client-side execution environments.

## TL;DR;

```console
$ helm install incubator/mean
```

## Introduction

This chart bootstraps a [NodeJS](https://github.com/bitnami/bitnami-docker-node) and a [MongoDB](https://github.com/bitnami/bitnami-docker-mongodb) deployment on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

It clones and deploys a Node.js application from a git repository. Defaults to a demo MEAN application: https://github.com/scotch-io/node-todo.git

## Prerequisites

- Kubernetes 1.4+ with Beta APIs enabled
- PV provisioner support in the underlying infrastructure

## Installing the Chart

To install the chart with the release name `my-release`:

```console
$ helm install --name my-release incubator/mean
```

The command deploys Node.js on the Kubernetes cluster in the default configuration. The [configuration](#configuration) section lists the parameters that can be configured during installation. Also includes support for MongoDB chart out of the box.

Due that the Helm Chart clones the application on the /app volume while the container is initializing, a persistent volume is not required.

> **Tip**: List all releases using `helm list`

## Uninstalling the Chart

To uninstall/delete the `my-release` deployment:

```console
$ helm delete my-release
```

The command removes all the Kubernetes components associated with the chart and deletes the release.

## Configuration

The following tables lists the configurable parameters of the NodeJS chart and their default values.

|           Parameter                |             Description             |                        Default                            |
|------------------------------------|-------------------------------------|-----------------------------------------------------------|
| `image`                            | NodeJS image                        | `bitnami/node:{VERSION}`                                  |
| `imagePullPolicy`                  | Image pull policy                   | `IfNotPresent`                                            |
| `repository`                       | Repo of the application             | `https://github.com/scotch-io/node-todo.git`              |
| `revision`                         | Revision  to checkout               | `master`                                                  |
| `config`                           | Contents of the config file for app | `See repo file config/database.js`                        |
| `configfile`                       | Filename of config file for app     | `database.js`                                             |
| `mongodb.mongodbRootPassword`      | MongoDB admin password              | `nil`                                                     |
| `mongodb.mongodbUsername`          | MongoDB username                    | `nil`                                                     |
| `mongodb.mongodbPassword`          | MongoDB username password           | `nil`                                                     |
| `mongodb.mongodbDatabase`          | MongoDB database name               | `nil`                                                     |
| `mongodb.persistence.enabled`      | MongoDB Persistent Volume enabled?  | `false`                                                   |
| `mongodb.persistence.storageClass` | Type of storage for PVC             | `default`                                                 |
| `mongodb.persistence.accessMode`   | Type of access mode for PVC         | `ReadWriteOnce`                                           |
| `mongodb.persistence.size`         | Disk size                           | `8Gi`                                                     |
| `serviceType`                      | Kubernetes Service type             | `LoadBalancer`                                            |
| `resources`                        | CPU/Memory resource requests/limits | Memory: `512Mi`, CPU: `300m`                              |
| `persistence.enabled`              | NodeJS persistence enabled?         | `false`                                                   |
| `persistence.storageClass`         | Type of storage for PVC             | If defined:                                               |
|                                                                            `volume.beta.kubernetes.io/storage-class: <storageClass>` |
|                                                                            Defaults:                                                 |
|                                                                            `volume.alpha.kubernetes.io/storage-class: default`       |
|--------------------------------------------------------------------------------------------------------------------------------------|

The above parameters map to the env variables defined in [bitnami/node](http://github.com/bitnami/bitnami-docker-node). For more information please refer to the [bitnami/node](http://github.com/bitnami/bitnami-docker-node) image documentation.

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```console
$ helm install --name my-release \
  --set repository=https://github.com/scotch-io/node-todo.git,mongodb.mongodbRootPassword=secretpassword \
    incubator/mean
```

The above command clones the remote git  repository to the `/app/` directory  of the container. Additionally it sets the MongoDB `root` user password to `secretpassword`.

Alternatively, a YAML file that specifies the values for the above parameters can be provided while installing the chart. For example,

```console
$ helm install --name my-release -f values.yaml incubator/mean
```

> **Tip**: You can use the default [values.yaml](values.yaml)

## Persistence

The [Bitnami NodeJS](https://github.com/bitnami/bitnami-docker-node) image stores the NodeJS application and configurations at the `/app`  path of the container.
This storage is ephemeral and it will disappear when the pods are taken away

Persistent Volume Claims are used to keep the data across deployments. This is known to work in GCE, AWS, and minikube.
See the [Configuration](#configuration) section to configure the PVC or to disable persistence.
