# Definition of Done

Una funcionalidad está terminada únicamente si:

- está implementada e integrada con sus dependencias;
- maneja errores básicos y valida sus entradas/salidas;
- tiene pruebas apropiadas y no rompe el build;
- está documentada cuando corresponde;
- no incluye credenciales, tokens ni archivos `.env`;
- funciona desde una instalación limpia.

## Done del MVP

El usuario puede iniciar una investigación y observar evidencia de base de datos, logs y anomalía; el agente identifica causa raíz e impacto; solicita aprobación explícita; ejecuta una recuperación confirmada por herramienta; verifica con evidencia real y solo entonces muestra `Incident Resolved`.
