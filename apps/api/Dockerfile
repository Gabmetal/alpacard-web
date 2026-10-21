FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY bin/server /app/server
COPY bin/worker /app/worker

ENV PORT=4000 \
    DB_DRIVER=postgres

EXPOSE 4000 9090

CMD ["/app/server"]
