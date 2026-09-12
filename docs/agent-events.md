# Contrato de eventos del agente

Cada evento incluye esta envoltura:

```json
{
  "id": "evt_...",
  "type": "tool_completed",
  "investigation_id": "inv_...",
  "timestamp": "2026-09-12T12:00:00Z",
  "status": "success",
  "data": {}
}
```

Los valores de `type` son: `investigation_started`, `tool_started`, `tool_completed`, `finding_created`, `root_cause_found`, `impact_calculated`, `approval_required`, `action_started`, `action_completed`, `verification_started` e `incident_resolved`.

## Datos por evento

| Evento | Campos requeridos en `data` |
| --- | --- |
| `investigation_started` | `user_request`, `plan` |
| `tool_started` | `tool`, `input` |
| `tool_completed` | `tool`, `output` o `error` |
| `finding_created` | `title`, `evidence` |
| `root_cause_found` | `cause`, `confidence`, `evidence` |
| `impact_calculated` | `records_affected`, `estimated_loss` |
| `approval_required` | `action`, `plan`, `approval_id` |
| `action_started` | `action`, `approval_id` |
| `action_completed` | `action`, `result` |
| `verification_started` | `verification` |
| `incident_resolved` | `verification`, `resolution` |

`status` es `running`, `success`, `failed` o `waiting_approval`. El frontend debe mostrar errores sin transformarlos en resolución; un `incident_resolved` solo puede emitirse después de un `verify_result` exitoso.
