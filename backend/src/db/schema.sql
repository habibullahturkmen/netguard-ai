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

CREATE TABLE IF NOT EXISTS alerts
(
    id             SERIAL PRIMARY KEY,
    source_ip      VARCHAR(50),
    destination_ip VARCHAR(50),
    protocol       VARCHAR(20),
    service        VARCHAR(50),
    prediction     VARCHAR(20),
    confidence     DECIMAL(5, 3),
    features       JSONB,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prediction
    ON traffic_logs(prediction);

CREATE INDEX idx_created_at
    ON traffic_logs(created_at);

CREATE INDEX idx_protocol_type
    ON traffic_logs(protocol_type);

CREATE INDEX idx_flag
    ON traffic_logs(flag);

CREATE INDEX idx_service
    ON traffic_logs(service);

CREATE INDEX IF NOT EXISTS idx_alerts_dest ON alerts (destination_ip);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at);
