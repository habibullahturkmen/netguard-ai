export interface TrafficLog {
  id: number;

  source_ip: string;
  destination_ip: string;

  protocol: string;

  prediction: string;
  attack_type: string;
  confidence: number;

  duration: number;

  protocol_type: string;
  service: string;
  flag: string;

  src_bytes: number;
  dst_bytes: number;

  created_at: string;
}

export interface Alert {
  id: number;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  service: string;
  prediction: string;
  attack_type: string;
  confidence: number;
  features: Record<string, unknown>;
  created_at: string;
}

export function formatAttackType(type: string | null | undefined): string {
  switch (type) {
    case "dos": return "DoS";
    case "port_scan": return "Port Scan";
    case "ml_anomaly": return "ML Anomaly";
    case "none": return "—";
    default: return type ? type : "—";
  }
}
