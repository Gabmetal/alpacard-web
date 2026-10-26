# 📈 Operations, Backups & Monitoring

This document details day-2 operations for Alpacard, including automated backup routines, disaster recovery procedures, and cluster observability.

---

## 💾 Automated Database Backups

Alpacard runs an automated Kubernetes `CronJob` that takes daily snapshots of the production PostgreSQL database:

```
+-------------------------------------------------------------------------+
|  Kubernetes CronJob: alpacard-backup                                    |
|  Schedule: Daily at 02:00 UTC (0 2 * * *)                               |
|                                                                         |
|  1. Executes pg_dump against alpacard-postgres-service:5432              |
|  2. Compresses dump: alpacard_backup_YYYYMMDD_HHMMSS.sql.gz             |
|  3. Writes to dedicated backup PersistentVolumeClaim                    |
|  4. Prunes backups older than 14 days automatically                     |
+-------------------------------------------------------------------------+
```

### Inspecting Backup Status
```bash
# View recent backup jobs
kubectl get jobs -n alpacard -l app=alpacard-backup

# View backup pod logs
kubectl logs -n alpacard job/alpacard-backup-<job-id>
```

---

## 🚨 Disaster Recovery & Database Restore Runbook

In the event of accidental data corruption or hardware failure, follow this procedure to restore the PostgreSQL state:

### Step 1: Scale down application consumers
Prevent new writes from mutating the database during restoration:
```bash
kubectl scale deployment/alpacard-api deployment/alpacard-worker -n alpacard --replicas=0
```

### Step 2: Identify the latest backup archive
```bash
kubectl exec -it alpacard-postgres-0 -n alpacard -- ls -lh /var/backups/
```

### Step 3: Stream and restore the database dump
```bash
# Decompress and pipe directly into PostgreSQL
gunzip -c /var/backups/alpacard_backup_20261026_020000.sql.gz | \
kubectl exec -i alpacard-postgres-0 -n alpacard -- psql -U alpacard -d alpacard
```

### Step 4: Scale application pods back up
```bash
kubectl scale deployment/alpacard-api deployment/alpacard-worker -n alpacard --replicas=1
kubectl rollout status deployment/alpacard-api -n alpacard
```

---

## 📊 Observability & Monitoring Architecture

Alpacard is continuously monitored using the **VictoriaMetrics Kubernetes Stack** and Grafana dashboards:

### 1. Prometheus Telemetry (`apps/api`)
The Go API exposes native Prometheus metrics on `/metrics`:
* `alpacard_http_requests_total{code="200|400|500", handler="/api/v1/stamps/scan"}`
* `alpacard_scan_duration_seconds_bucket{le="0.05|0.1|0.25|0.5|1.0"}`
* `alpacard_db_pool_open_connections`
* `alpacard_db_pool_in_use_connections`

### 2. Key Service Level Indicators (SLIs & SLOs)

| Metric | Target SLO | Alert Condition |
| :--- | :--- | :--- |
| **Cashier Scan Latency** | $p95 < 150\text{ ms}$ | $p95 > 300\text{ ms}$ for 5 consecutive minutes |
| **API Availability** | $99.9\%$ uptime | HTTP 5xx error rate $> 0.5\%$ |
| **RabbitMQ Queue Lag** | $< 100$ unconsumed messages | Queue depth $> 500$ messages |
| **Database Pool Saturation** | $< 70\%$ pool capacity | $> 90\%$ connections in use for 3 minutes |

---

## 🛠️ Common Operational Runbooks

### Runbook 1: Force TLS Certificate Renewal
If a certificate ever fails automatic renewal or is reported expired:
```bash
# Force cert-manager to renew the certificate
kubectl delete secret alpacard-tls -n alpacard
kubectl delete secret alpacard-dev-tls -n alpacard-dev

# Monitor issuance progress
kubectl get certificate,certificaterequest,orders -A
```

### Runbook 2: Inspecting RabbitMQ Message Queues
To inspect message throughput and queue saturation:
```bash
# Exec into RabbitMQ pod
kubectl exec -it -n alpacard deployment/alpacard-rabbitmq -- rabbitmqctl list_queues name messages_ready consumers
```

### Runbook 3: Rolling Restart After Secret Updates
If environment variables or database passwords are changed in Kubernetes Secrets:
```bash
kubectl rollout restart deployment/alpacard-api deployment/alpacard-worker -n alpacard
kubectl rollout status deployment/alpacard-api -n alpacard
```
