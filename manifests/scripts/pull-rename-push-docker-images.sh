#!/bin/bash
repo=harbor-001.jimmysong.io/library/
cat $1|while read line
do
    docker pull $line
    old_name=`echo $line|cut -d ":" -f1`
    tag=`echo $line|cut -d ":" -f2`
    new_name=$repo`echo $old_name|cut -d "/" -f1`-`echo $old_name|cut -d "/" -f2`:$tag
    echo "Change $line => $new_name"
    id=`docker images|grep $old_name|tr -s " "|cut -d " " -f3`
    docker tag $id $new_name
    docker push $new_name
done
