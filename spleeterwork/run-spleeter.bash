#!/bin/bash
for i in "$@"
do
case $i in
    -f=*|--filename=*)
    FILENAME="${i#*=}"
    ;;
    -o=*|--outputfolder=*)
    OUTPUTFOLDER="${i#*=}"
    ;;
    -s=*|--stems=*)
    STEMS="${i#*=}"
    ;;
    --spleeterpath=*)
    SPLEETERPATH="${i#*=}"
    ;;
    -u=*|--user=*)
    USERID="${i#*=}"
    ;;
    *)
    ;;
esac
done
#echo FILENAME = ${FILENAME}
#echo OUTPUTFOLDER = ${OUTPUTFOLDER}
#echo STEMS = ${STEMS}
# echo USERID = ${USERID}
# echo SPLEETERPATH = ${SPLEETERPATH}

#containername=${FILENAME%%.*}$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13)
containerid=$(sudo docker run -d \
    -v ${SPLEETERPATH}/input:/input \
    -v ${SPLEETERPATH}/output:/output \
    -v ${SPLEETERPATH}/models:/model \
    -e MODEL_PATH=/model \
    --user ${USERID}:${USERID} \
    spleeter:cpu \
    separate -i /input/${FILENAME} -o /output -p spleeter:${STEMS}stems)

status_code="$(docker container wait $containerid)"
echo "Status code: ${status_code}"
if [ "$status_code" -ne 0 ]
then
  mkdir -p ${SPLEETERPATH}/logs/${OUTPUTFOLDER}
  docker logs $containerid >& ${SPLEETERPATH}/logs/${OUTPUTFOLDER}/$FILENAME.log
fi
docker container rm $containerid