FROM node:22

RUN npm install -g npm@11

RUN apt-get update && \
    apt-get install -y build-essential libclang-dev curl && \
    rm -rf /var/lib/apt/lists/*

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"
# ENV LIBCLANG_PATH="/usr/lib/llvm-12/lib"

WORKDIR /build 

RUN npm install
RUN npm run build
