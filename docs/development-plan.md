# Plan de desarrollo MVP

El alcance se limita al flujo: incidente → investigación → causa raíz → recuperación aprobada → verificación. No incluye Slack, Teams, múltiples agentes, autenticación compleja, tickets, mobile ni capacidades multiempresa.

## Epic 1 — Agent (`feature/agent`)

- [ ] RootCause system prompt
- [ ] Inicialización y contexto de investigación
- [ ] Tool calling y planificador
- [ ] Eventos de findings y causa raíz
- [ ] Cálculo de impacto
- [ ] Flujo de aprobación, recuperación y verificación

## Epic 2 — Backend/Data (`feature/backend-data`)

- [ ] Schema y modelos de base de datos
- [ ] Seed reproducible y escenario de incidente
- [ ] `query_database`, `detect_anomaly`, `analyze_logs`
- [ ] `calculate_impact`, `execute_recovery`, `verify_result`
- [ ] Endpoints API y manejo básico de errores

## Epic 3 — Frontend (`feature/frontend`)

- [ ] Dashboard y Command Center
- [ ] Chat, timeline y estado de herramientas
- [ ] Findings, Root Cause Card e Impact Card
- [ ] UI de aprobación, recuperación, verificación y resuelto

## Epic 4 — Integration / QA (`feature/integration-demo`)

- [ ] Conectar frontend/backend y backend/agent
- [ ] Prueba end-to-end, manejo de errores y clean clone
- [ ] Datos demo, ensayo, README final y submission

## Primeras tareas por participante

### P1 — Implement RootCause Agent and orchestration

**Objetivo:** construir el flujo de investigación guiado por los contratos. **Archivos esperados:** `agent/prompts/`, `agent/tools/`, `agent/orchestration/`. **Resultado:** una investigación emite eventos, solicita aprobación y nunca declara éxito sin respuesta de herramienta. **Aceptación:** herramientas invocadas en orden trazable; eventos válidos; tests unitarios del flujo.

### P2 — Implement database, incident scenario and agent tools

**Objetivo:** entregar datos reproducibles y herramientas reales. **Archivos esperados:** `backend/`, `database/`, `tests/`. **Resultado:** ventas con caída de ~38 %, log ETL de duplicados y recuperación verificable. **Aceptación:** respuestas siguen el contrato, la recuperación exige aprobación y `GET /health` continúa funcionando.

### P3 — Implement RootCause command center UI

**Objetivo:** visualizar estado, evidencia, aprobación y resolución. **Archivos esperados:** `frontend/`. **Resultado:** UI consume los eventos documentados y muestra los estados del incidente. **Aceptación:** `npm run lint` y `npm run build` pasan; no se hardcodean resultados como estado del sistema.

### P4 — Implement integration, E2E validation and demo

**Objetivo:** integrar las ramas y dejar la demo repetible. **Archivos esperados:** `docs/`, `demo/`, `tests/`. **Resultado:** clean clone ejecuta el recorrido completo. **Aceptación:** prueba E2E, guion de menos de dos minutos, documentación actualizada y revisión de secretos.
