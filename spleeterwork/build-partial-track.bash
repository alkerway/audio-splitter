#!/bin/bash
for i in "$@"
do
case $i in
    -f=*|--filelocation=*)
    FILELOCATION="${i#*=}"
    ;;
    -r=*|--remove=*)
    REMOVE="${i#*=}"
    ;;
    --spleeterpath=*)
    SPLEETERPATH="${i#*=}"
    ;;
    *)
    ;;
esac
done
#echo FILELOCATION = ${FILELOCATION}
#echo REMOVE = ${REMOVE}
#echo SPLEETERPATH = ${SPLEETERPATH}

yourfilenames=`ls $SPLEETERPATH/$FILELOCATION`
command=""
numinputs=0
for eachfile in $yourfilenames
do
  if [ "${eachfile%%.*}" != $REMOVE ]
  then
    numinputs=$((numinputs+1))
    command="${command} -i $SPLEETERPATH/$FILELOCATION/$eachfile"
   fi
done
command="${command} -filter_complex amix=inputs=$numinputs:duration=longest $SPLEETERPATH/$FILELOCATION/no$REMOVE.wav"
$(ffmpeg $command)