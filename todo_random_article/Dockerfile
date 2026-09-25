FROM alpine:3.20

RUN apk add --no-cache curl jq

WORKDIR /usr/src/app

COPY script.sh ./
RUN chmod +x script.sh

CMD ["./script.sh"]
