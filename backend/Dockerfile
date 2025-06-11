FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    nmap \
    nano \
    git \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

CMD ["/bin/bash"]