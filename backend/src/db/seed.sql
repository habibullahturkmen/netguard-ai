INSERT INTO traffic_logs (source_ip,
                          destination_ip,
                          protocol,
                          prediction,
                          confidence,
                          duration,
                          protocol_type,
                          service,
                          flag,
                          src_bytes,
                          dst_bytes)
VALUES

-- Normal Traffic
('192.168.1.10', '8.8.8.8', 'TCP', 'Normal', 95.40, 2.5, 'tcp', 'http', 'SF', 181, 5450),

('192.168.1.11', '1.1.1.1', 'TCP', 'Normal', 93.80, 1.2, 'tcp', 'http', 'SF', 239, 486),

('192.168.1.12', '8.8.4.4', 'UDP', 'Normal', 94.10, 0.8, 'udp', 'domain', 'SF', 105, 300),

('192.168.1.13', '172.217.1.14', 'TCP', 'Normal', 96.70, 3.1, 'tcp', 'https', 'SF', 512, 12000),

('192.168.1.14', '13.107.42.14', 'TCP', 'Normal', 97.20, 4.7, 'tcp', 'https', 'SF', 1024, 18000),

('192.168.1.15', '8.8.8.8', 'UDP', 'Normal', 92.60, 1.0, 'udp', 'domain', 'SF', 128, 450),

('192.168.1.16', '151.101.1.69', 'TCP', 'Normal', 94.80, 2.9, 'tcp', 'http', 'SF', 420, 8200),

('192.168.1.17', '104.16.132.229', 'TCP', 'Normal', 95.90, 3.8, 'tcp', 'https', 'SF', 890, 15400),

('192.168.1.18', '8.8.4.4', 'UDP', 'Normal', 93.30, 0.6, 'udp', 'domain', 'SF', 110, 260),

('192.168.1.19', '20.190.128.0', 'TCP', 'Normal', 96.10, 5.4, 'tcp', 'https', 'SF', 1400, 22000),

-- Suspicious Traffic
('10.0.0.21', '192.168.1.100', 'TCP', 'Suspicious', 98.90, 15.4, 'tcp', 'ftp', 'REJ', 7000, 3500),

('10.0.0.22', '192.168.1.101', 'TCP', 'Suspicious', 99.10, 18.2, 'tcp', 'ftp', 'REJ', 9500, 4100),

('10.0.0.23', '192.168.1.102', 'TCP', 'Suspicious', 98.50, 12.7, 'tcp', 'http', 'S0', 6000, 2000),

('10.0.0.24', '192.168.1.103', 'TCP', 'Suspicious', 97.80, 20.3, 'tcp', 'private', 'REJ', 12000, 1500),

('10.0.0.25', '192.168.1.104', 'TCP', 'Suspicious', 99.30, 25.1, 'tcp', 'private', 'S0', 15000, 1000),

('10.0.0.26', '192.168.1.105', 'UDP', 'Suspicious', 97.60, 16.8, 'udp', 'other', 'REJ', 8000, 900),

('10.0.0.27', '192.168.1.106', 'TCP', 'Suspicious', 98.20, 22.0, 'tcp', 'ftp_data', 'REJ', 13000, 2000),

('10.0.0.28', '192.168.1.107', 'TCP', 'Suspicious', 99.00, 30.5, 'tcp', 'private', 'S0', 18000, 500),

('10.0.0.29', '192.168.1.108', 'ICMP', 'Suspicious', 98.70, 10.0, 'icmp', 'eco_i', 'REJ', 4000, 0),

('10.0.0.30', '192.168.1.109', 'ICMP', 'Suspicious', 99.50, 28.7, 'icmp', 'eco_i', 'S0', 20000, 0);
