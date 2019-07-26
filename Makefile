image := jimmysong/website-builder:2019-07-18
docker := docker run -t -i --sig-proxy=true --rm -v $(shell pwd):/site -w /site $(image)
build:
	hugo build
lint:
	@$(docker) scripts/lint-site.sh
serve:
	hugo server
count:
	scripts/wordcount.sh
