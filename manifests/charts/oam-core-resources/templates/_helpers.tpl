{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "oam-core-resources.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name, otherwise, it will be append to the chart name
*/}}
{{- define "oam-core-resources.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" $name .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "oam-core-resources.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Use webhook argument
*/}}
{{- define "oam-core-resources.use-webhook" -}}
{{- if .Values.useWebhook -}}
{{- "--enable-webhook=true" -}}
{{- else -}}
{{- "--enable-webhook=false" -}}
{{- end -}}
{{- end -}}

{{/*
Use create namespace
*/}}
{{- define "oam-core-resources.createNamespace" -}}
{{- if eq .Release.Namespace "default" -}}
{{- false -}}
{{- else -}}
{{- true -}}
{{- end -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "oam-core-resources.labels" -}}
helm.sh/chart: {{ include "oam-core-resources.chart" . }}
{{ include "oam-core-resources.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "oam-core-resources.selectorLabels" -}}
app.kubernetes.io/name: {{ include "oam-core-resources.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "oam-core-resources.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "oam-core-resources.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}
