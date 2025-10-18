FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    kali-linux-default \
    nano \
    git \
    net-tools \
    sudo \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash student
RUN adduser student sudo
RUN echo "student ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

USER student
WORKDIR /home/student

CMD ["/bin/bash"]