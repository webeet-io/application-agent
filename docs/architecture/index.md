# Architecture Index

This directory contains the approved software architecture for CeeVee.

## Documents

- [overview.md](./overview.md)
  Explains the architectural direction, governing principles, chosen runtime shape, and major tradeoffs.

- [system-context.md](./system-context.md)
  Describes the main actors, system boundaries, and end-to-end interaction flow.

- [module-design.md](./module-design.md)
  Defines the internal module structure, hexagonal boundaries, and ownership of core components.

- [interfaces.md](./interfaces.md)
  Documents the main internal and external interfaces, including MCP tools and adapter-facing contracts.

- [boundaries.md](./boundaries.md)
  Defines the major system boundaries, responsibility splits, and model separation rules of the architecture.

- [port-contracts.md](./port-contracts.md)
  Defines the external-facing domain ports, their contract shape, ownership, and failure behavior.

- [data-model.md](./data-model.md)
  Defines the core entities, relationships, data lifecycle, and vector-search responsibilities.

- [runtime-observability.md](./runtime-observability.md)
  Describes runtime behavior, background processing, reliability concerns, and operational visibility.

## Relationship Between Documents

- `overview.md` is the entry point for architectural decisions.
- `system-context.md` explains how external actors interact with the system.
- `module-design.md` explains how the system is structured internally.
- `interfaces.md` defines the contracts that connect modules and external consumers.
- `boundaries.md` defines where responsibility, runtime, and data-model boundaries must remain explicit.
- `port-contracts.md` defines the domain-facing contracts that external adapters must satisfy.
- `data-model.md` defines the persistent model used by the runtime modules.
- `runtime-observability.md` explains how the architecture behaves in operation.

All documents in this directory describe the current approved architecture state only.
