FROM debian:bullseye-slim

# Install vsftpd
RUN apt-get update && \
    apt-get install -y vsftpd && \
    rm -rf /var/lib/apt/lists/*

# Create FTP user and directory
RUN useradd -m ftpuser && \
    mkdir -p /home/ftpuser/ftp/upload && \
    chown -R ftpuser:ftpuser /home/ftpuser/ftp && \
    chmod 777 /home/ftpuser/ftp/upload

# Configure vsftpd
COPY vsftpd.conf /etc/vsftpd.conf

# Expose FTP ports
EXPOSE 20 21

# Start vsftpd
CMD ["/usr/sbin/vsftpd", "/etc/vsftpd.conf"]