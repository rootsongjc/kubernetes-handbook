#!/bin/bash
# Count Chinese characters
total=0
basedir="../../"
for x in `cd $basedir;fd -e md`
do
    i=`cnwordcount -f $basedir/$x|cut -d " " -f2`
    total=$(($total+$i))
    if [ $i -ne 0 ]; then 
        echo "$x $i"
    fi
done
echo "Total $total"
