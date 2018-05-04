all: build push clean
.PHONY: build push clean

TAG = v2

# Build for linux amd64
build:
	GOOS=linux GOARCH=amd64 go build -o hello${TAG} main.go
	docker build -t harbor-001.jimmysong.io/library/hello:${TAG} .

# Push to tenxcloud
push:
	docker push harbor-001.jimmysong.io/library/hello:${TAG}

# Clean 
clean:
	rm -f hello${TAG}
