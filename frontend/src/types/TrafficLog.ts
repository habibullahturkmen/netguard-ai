export interface TrafficLog {
  id: number;

  source_ip: string;
  destination_ip: string;

  protocol: string;

  prediction: string;
  confidence: number;

  duration: number;

  protocol_type: string;
  service: string;
  flag: string;

  src_bytes: number;
  dst_bytes: number;

  created_at: string;
}
