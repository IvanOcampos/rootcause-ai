# Contrato Agent ↔ Backend tools

Todas las respuestas son JSON estructurado. Los errores usan `{ "error": { "code": "...", "message": "...", "retryable": false } }`. Las herramientas de lectura no tienen efectos secundarios; `execute_recovery` es la única herramienta mutante y exige `approved: true` asociado a una investigación válida.

## `query_database`

- **Propósito:** consultar conjuntos de datos permitidos para la investigación.
- **Input:** `{ "query": "sales_summary|duplicate_records", "filters": {} }`.
- **Output:** `{ "rows": [], "row_count": 0, "source": "sqlite" }`.
- **Errores:** `INVALID_QUERY`, `INVALID_FILTER`.
- **Side effects / approval:** ninguno / no.

## `detect_anomaly`

- **Propósito:** comparar una métrica con su referencia histórica.
- **Input:** `{ "metric": "sales", "date_range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" } }`.
- **Output:** `{ "is_anomaly": true, "expected_value": 100000, "actual_value": 62000, "deviation_percentage": -38 }`.
- **Errores:** `UNSUPPORTED_METRIC`, `INSUFFICIENT_HISTORY`.
- **Side effects / approval:** ninguno / no.

## `analyze_logs`

- **Propósito:** encontrar evidencia operacional relacionada.
- **Input:** `{ "process_name": "inventory_etl", "date_range": { "from": "...", "to": "..." } }`.
- **Output:** `{ "entries": [{ "status": "error", "error_type": "duplicate_records", "message": "...", "timestamp": "..." }] }`.
- **Errores:** `INVALID_DATE_RANGE`.
- **Side effects / approval:** ninguno / no.

## `calculate_impact`

- **Propósito:** cuantificar los datos y dinero afectados.
- **Input:** `{ "incident_id": "...", "region": "optional" }`.
- **Output:** `{ "records_affected": 12453, "estimated_loss": 125000, "affected_period": "...", "affected_region": "..." }`.
- **Errores:** `INCIDENT_NOT_FOUND`, `IMPACT_UNAVAILABLE`.
- **Side effects / approval:** ninguno / no.

## `execute_recovery`

- **Propósito:** aislar duplicados y reprocesar el lote ETL.
- **Input:** `{ "incident_id": "...", "approved": true, "approval_id": "..." }`.
- **Output:** `{ "status": "success", "records_processed": 12453, "message": "Recovery completed" }`.
- **Errores:** `APPROVAL_REQUIRED`, `INVALID_APPROVAL`, `RECOVERY_FAILED`.
- **Side effects / approval:** modifica el escenario / sí.

## `verify_result`

- **Propósito:** comprobar la recuperación mediante evidencia posterior.
- **Input:** `{ "incident_id": "..." }`.
- **Output:** `{ "verified": true, "before_value": 62000, "after_value": 99400, "message": "Incident successfully resolved" }`.
- **Errores:** `RECOVERY_NOT_RUN`, `VERIFICATION_FAILED`.
- **Side effects / approval:** ninguno / no.
