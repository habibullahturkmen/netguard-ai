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
