CREATE TABLE traffic_logs
(

    id             SERIAL PRIMARY KEY,

    source_ip      VARCHAR(50),
    destination_ip VARCHAR(50),

    protocol       VARCHAR(20),

    prediction     VARCHAR(20),
    confidence     DECIMAL(5, 2),

    duration       FLOAT,

    protocol_type  VARCHAR(10),
    service        VARCHAR(50),
    flag           VARCHAR(10),

    src_bytes      BIGINT,
    dst_bytes      BIGINT,

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
