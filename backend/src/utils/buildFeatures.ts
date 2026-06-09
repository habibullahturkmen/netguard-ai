export function buildFeatures(body: any) {
  const protocolType = String(body.protocol ?? body.protocol_type ?? "tcp")
    .trim()
    .toLowerCase() || "tcp";
  const service = String(body.service ?? "http").trim().toLowerCase() || "http";
  const flag = String(body.flag ?? "SF").trim().toUpperCase() || "SF";

  return {
    duration: body.duration ?? 0,
    protocol_type: protocolType,
    service,
    flag,

    src_bytes: body.src_bytes ?? body.srcBytes ?? 0,
    dst_bytes: body.dst_bytes ?? body.dstBytes ?? 0,

    land: body.land ?? 0,
    wrong_fragment: body.wrong_fragment ?? 0,
    urgent: body.urgent ?? 0,
    hot: body.hot ?? 0,
    num_failed_logins: body.num_failed_logins ?? 0,
    logged_in: body.logged_in ?? 1,
    num_compromised: body.num_compromised ?? 0,
    root_shell: body.root_shell ?? 0,
    su_attempted: body.su_attempted ?? 0,
    num_root: body.num_root ?? 0,
    num_file_creations: body.num_file_creations ?? 0,
    num_shells: body.num_shells ?? 0,
    num_access_files: body.num_access_files ?? 0,
    num_outbound_cmds: body.num_outbound_cmds ?? 0,
    is_host_login: body.is_host_login ?? 0,
    is_guest_login: body.is_guest_login ?? 0,

    count: body.count ?? 1,
    srv_count: body.srv_count ?? body.srvCount ?? 1,
    serror_rate: body.serror_rate ?? body.serrorRate ?? 0,
    srv_serror_rate: body.srv_serror_rate ?? body.srvSerrorRate ?? 0,
    rerror_rate: body.rerror_rate ?? 0,
    srv_rerror_rate: body.srv_rerror_rate ?? 0,
    same_srv_rate: body.same_srv_rate ?? 1,
    diff_srv_rate: body.diff_srv_rate ?? 0,
    srv_diff_host_rate: body.srv_diff_host_rate ?? 0,

    dst_host_count: body.dst_host_count ?? 1,
    dst_host_srv_count: body.dst_host_srv_count ?? 1,
    dst_host_same_srv_rate: body.dst_host_same_srv_rate ?? 1,
    dst_host_diff_srv_rate: body.dst_host_diff_srv_rate ?? 0,
    dst_host_same_src_port_rate: body.dst_host_same_src_port_rate ?? 0,
    dst_host_srv_diff_host_rate: body.dst_host_srv_diff_host_rate ?? 0,
    dst_host_serror_rate: body.dst_host_serror_rate ?? 0,
    dst_host_srv_serror_rate: body.dst_host_srv_serror_rate ?? 0,
    dst_host_rerror_rate: body.dst_host_rerror_rate ?? 0,
    dst_host_srv_rerror_rate: body.dst_host_srv_rerror_rate ?? 0,
  };
}
