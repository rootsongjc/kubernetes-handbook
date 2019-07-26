#!/bin/bash
total=0
for x in `fd .md content `
do
    i=`cnwordcount -f $x|cut -d " " -f2`
    total=$(($total+$i))
    if [ $i -ne 0 ]; then
        echo "$x $i"
    fi
done
echo "Total $total"
