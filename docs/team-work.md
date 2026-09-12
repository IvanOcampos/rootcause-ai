# Trabajo en equipo

`main` permanece estable. `develop` integra el trabajo aprobado. Cada rama de participante nace de `develop` y se integra mediante Pull Request hacia `develop`.

| Participante | Rama | Área | Responsabilidad |
| --- | --- | --- | --- |
| 1 | `feature/agent` | AI Agent | Agente, orquestación y contrato de herramientas |
| 2 | `feature/backend-data` | Backend/Data | API, base de datos y herramientas |
| 3 | `feature/frontend` | Frontend | UI/UX y consumo de eventos |
| 4 | `feature/integration-demo` | QA/Integration | Integración, tests, demo y documentación |

## Antes de comenzar

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<nombre>
```

Cada participante trabaja exclusivamente en su área. Antes de cambiar un archivo de otra área, debe abrir una tarea de integración y acordarlo con su responsable. Los contratos en `docs/agent-tool-contract.md` y `docs/agent-events.md` son la interfaz compartida; modificarlos requiere coordinación entre Agent, Backend y Frontend.

## Commits, push y Pull Request

Haz commits pequeños y descriptivos, por ejemplo `feat: implement anomaly detection tool`, `fix: correct recovery verification`, `docs: update architecture` o `test: add incident investigation test`.

```bash
git add <archivos>
git commit -m "feat: concise change description"
git push -u origin feature/<nombre>
```

Abre un Pull Request desde la rama de feature hacia `develop`. Incluye el objetivo, pruebas ejecutadas, contratos modificados y dependencias pendientes. No se integra código que rompa los checks ni que contenga secretos.

## Sincronización con develop

Antes de abrir o actualizar un PR:

```bash
git fetch origin
git checkout feature/<nombre>
git merge origin/develop
```

Resuelve conflictos en tu propia rama, vuelve a ejecutar los checks y sube el resultado. `main` solo recibe PRs estables desde `develop` para hitos demostrables.

## Checks mínimos

Frontend:

```bash
npm run lint
npm run build
```

Backend: ejecutar los tests existentes y comprobar `GET /health`. Integration/QA verifica además el flujo completo desde una instalación limpia.
