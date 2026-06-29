// WebRTC "leak test": gathering ICE candidates can reveal IP addresses the
// browser knows about locally, even when the visible traffic is tunneled
// through a VPN. A private-range candidate just confirms you're behind some
// NAT (expected); a *public* candidate that differs from your VPN exit IP is
// the classic "WebRTC leak" that defeats a VPN's privacy goal.

export async function getWebrtcCandidateIps(timeoutMs = 1500): Promise<string[]> {
  return new Promise((resolve) => {
    const ips = new Set<string>();
    let pc: RTCPeerConnection;

    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    } catch {
      resolve([]);
      return;
    }

    pc.createDataChannel(''); // forces ICE gathering to actually start

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const match = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (match) ips.add(match[1]);
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {
        /* ignore — we still wait for the timeout below */
      });

    setTimeout(() => {
      pc.close();
      resolve([...ips]);
    }, timeoutMs);
  });
}

const PRIVATE_RANGES = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^127\./,
];

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some((re) => re.test(ip));
}

export interface WebrtcResult {
  privateIps: string[];
  publicIps: string[];
}

export function classifyWebrtcIps(ips: string[]): WebrtcResult {
  return {
    privateIps: ips.filter(isPrivateIp),
    publicIps: ips.filter((ip) => !isPrivateIp(ip)),
  };
}
