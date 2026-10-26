# ☸️ Infrastructure, Kubernetes & Networking

Alpacard runs on a production-grade, highly optimized **k3s Kubernetes cluster** hosted on bare-metal hardware with software-defined networking, automated TLS certificate provisioning, and isolated zero-trust VPN staging access.

---

## 🏗️ Cluster Topology

```
+-----------------------------------------------------------------------------------+
|  PHYSICAL HOST: xeon (Ubuntu 26.04 LTS, IP 192.168.0.103)                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |  k3s Kubernetes Control Plane & Worker                                      |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |  MetalLB Layer 2 Load Balancer -> Virtual IP: 192.168.0.50             |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |                                      |                                      |  |
|  |                                      v                                      |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |  Traefik Ingress Controller (Ports 80 & 443 TLS Termination)           |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |                    |                                   |                    |  |
|  |                    v (Host: alpacard.app)               v (Host: dev...)     |  |
|  |  +------------------------------------+  +-------------------------------+  |  |
|  |  |  Namespace: alpacard (PROD)        |  |  Namespace: alpacard-dev (DEV)|  |  |
|  |  |  • alpacard-web (Nginx/React)      |  |  • alpacard-web (Nginx/React) |  |  |
|  |  |  • alpacard-wallet (PWA)           |  |  • alpacard-wallet (PWA)      |  |  |
|  |  |  • alpacard-api (Go Server)        |  |  • alpacard-api (Go Server)   |  |  |
|  |  |  • alpacard-worker (Go Consumer)   |  |  • alpacard-worker (Consumer) |  |  |
|  |  |  • PostgreSQL 16 (StatefulSet)     |  |  • PostgreSQL 16 (Isolated)   |  |  |
|  |  |  • RabbitMQ 3.13 (Message Broker)  |  |  • RabbitMQ 3.13 (Isolated)   |  |  |
|  |  +------------------------------------+  +-------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🔒 Multi-Environment Isolation

| Layer | Production (`alpacard`) | Development (`alpacard-dev`) |
| :--- | :--- | :--- |
| **Domain** | [https://alpacard.app](https://alpacard.app) | [https://dev.alpacard.app](https://dev.alpacard.app) |
| **Network Reachability** | Public Internet (Proxied by Cloudflare Edge CDN) | **Private Only**: Routed via Tailscale VPN subnet (`192.168.0.0/24`) |
| **Kubernetes Namespace** | `alpacard` | `alpacard-dev` |
| **Database Instance** | Dedicated PostgreSQL 16 with automated daily backups | Fully isolated PostgreSQL instance (`alpacard_dev`) |
| **Message Broker** | Production RabbitMQ cluster | Isolated RabbitMQ instance |
| **TLS Certificates** | Automated Let's Encrypt multi-SAN SSL | Automated Let's Encrypt TLS via Cloudflare DNS-01 |

---

## 📜 Automated TLS & Cert-Manager Architecture

TLS certificates are issued and renewed automatically using `cert-manager` and the **Cloudflare DNS-01 challenge solver**:

### ClusterIssuer Configuration (`letsencrypt-prod`)
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: Cavallo.v.gabriel@gmail.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    # Anchors certificate issuance directly to universal ISRG Root X1 for 100% iOS/Android compatibility
    preferredChain: "ISRG Root X1"
    solvers:
    - dns01:
        cloudflare:
          apiTokenSecretRef:
            key: api-token
            name: cloudflare-api-token-secret
```

* **Why DNS-01?**: Because `dev.alpacard.app` resolves to an RFC 1918 private IP address (`192.168.0.50`), HTTP-01 challenges are impossible. The DNS-01 solver creates temporary TXT records in Cloudflare DNS, allowing Let's Encrypt to validate domain ownership even for private intranet environments.
* **Why `preferredChain: "ISRG Root X1"`?**: Bypasses intermediate `Root YR` hierarchies that can trigger `NET::ERR_CERT_AUTHORITY_INVALID` warnings on older mobile trust stores, providing instant zero-warning SSL validation on mobile Chrome and iOS Safari.

---

## 🛡️ Zero-Trust Staging VPN via Tailscale

To allow QA testers, developers, and stakeholders to test the non-production environment from anywhere in the world on mobile data (4G/5G) or remote WiFi without opening insecure router firewall ports:

1. **Hardware Subnet Router**:
   - An OpenWrt home router (`192.168.0.1`) runs Tailscale.
   - Advertises the local LAN subnet:
     ```bash
     tailscale up --advertise-routes=192.168.0.0/24 --accept-routes
     ```
2. **Accessing the Dev Environment**:
   - Any authorized user installs the Tailscale app on their iPhone, Android, or laptop.
   - When connected to the Tailscale mesh network, their device seamlessly routes traffic destined for `192.168.0.0/24` through the OpenWrt router.
   - Opening `https://dev.alpacard.app` resolves directly to `192.168.0.50`, presenting the fully isolated staging environment with valid Let's Encrypt green padlock TLS.
