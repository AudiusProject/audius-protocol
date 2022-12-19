FROM ubuntu:22.04

ENV WORKDIR /app
WORKDIR ${WORKDIR}

RUN apt-get update \
    && apt-get install -y \
        git \
        gnupg \
        jq \
        moreutils \
        wget \
    && sh -c "echo 'deb https://gitsecret.jfrog.io/artifactory/git-secret-deb git-secret main' \
        >> /etc/apt/sources.list" \
    && wget -q 'https://gitsecret.jfrog.io/artifactory/api/gpg/key/public' -O /tmp/gitsecret.key \
    && md5sum /tmp/gitsecret.key | grep -q "e941935ec5dd72a60086e1b5112ade3d" \
        || exit \
    && apt-key add /tmp/gitsecret.key \
    && apt-get update \
    && apt-get install -y \
        git-secret

WORKDIR /tmp
RUN wget https://github.com/tcnksm/ghr/releases/download/v0.15.0/ghr_v0.15.0_linux_amd64.tar.gz \
    && md5sum ghr_v0.15.0_linux_amd64.tar.gz | grep -q "b820693296a40bddb3873284f6051b87" \
        || exit \
    && tar xf ghr_v0.15.0_linux_amd64.tar.gz \
    && mv ghr_v0.15.0_linux_amd64/ghr ${WORKDIR}/
WORKDIR ${WORKDIR}

RUN git clone https://github.com/AudiusProject/audius-protocol.git

COPY cut.sh ./

CMD ./cut.sh