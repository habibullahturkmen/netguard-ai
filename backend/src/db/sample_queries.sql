-- View All Logs
SELECT *
FROM traffic_logs
ORDER BY created_at DESC;

-- Count Predictions
SELECT
    prediction,
    COUNT(*) AS total
FROM traffic_logs
GROUP BY prediction;

-- Protocol Distribution
SELECT
    protocol_type,
    COUNT(*) AS total
FROM traffic_logs
GROUP BY protocol_type;

-- Service Distribution
SELECT
    service,
    COUNT(*) AS total
FROM traffic_logs
GROUP BY service;

-- Flag Distribution
SELECT
    flag,
    COUNT(*) AS total
FROM traffic_logs
GROUP BY flag;

-- Top Suspicious Traffic
SELECT *
FROM traffic_logs
WHERE prediction = 'Suspicious'
ORDER BY confidence DESC;

-- Average Traffic Volume
SELECT
    AVG(src_bytes) AS avg_src_bytes,
    AVG(dst_bytes) AS avg_dst_bytes
FROM traffic_logs;
