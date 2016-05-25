# Docker Container Details

A small Node.js application which will show details about the container:

 - OS information
 - Environment Variables
 - IP Addresses

In addition to that you can also:

 - List all containers
 - Inspect a container
 - View logs for a container

This can be useful when deploying containers in a cluster environment and you want to get more information about the current environment (eg: environment variables related to service discovery).

![](/media/screenshot.png)

## Usage

Building the image:

```bash
IMAGE=sandrinodimattia/docker-container-details
VERSION=1.0.0
docker build -t ${IMAGE}:${VERSION} .
docker tag ${IMAGE}:${VERSION} ${IMAGE}:latest
```

Push the image:

```bash
docker push sandrinodimattia/docker-container-details
```

Running the container:

```bash
docker stop docker-container-details
docker rm docker-container-details
docker run -d -v /var/run/docker.sock:/var/run/docker.sock \
  --name  docker-container-details -p 3000:3000 sandrinodimattia/docker-container-details
```
