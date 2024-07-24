FROM timberio/vector:0.39.0-alpine

ARG audius_axiom_token
ENV audius_axiom_token ${audius_axiom_token}

RUN apk add gettext

COPY vector.toml /vector.toml

COPY start.sh /start.sh

ENTRYPOINT [ "sh", "/start.sh" ]
CMD
