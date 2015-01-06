#!/bin/bash -eu

HERE=$(dirname $($(type -P greadlink || type -P readlink) -f "$0"))
JQ=$HERE/../../bin/jq

DATA=$(curl -s "http://www.telize.com/geoip")

get() {
	local name=$1
	echo "$DATA" | $JQ .$name
}

echo '{
	"longitude": '$(get longitude)',
	"latitude": '$(get latitude)',
	"ip": '$(get ip)',
	"city": '$(get city)',
	"region": '$(get region)',
	"country": '$(get country)',
	"timezone": '$(get timezone)'
}'
