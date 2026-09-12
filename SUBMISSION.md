# RootCause AI — Hackathon submission

## Project

**RootCause AI** investigates operational data incidents end to end: it gathers evidence, identifies a root cause, estimates impact, requests human approval for recovery, executes the approved action, and verifies the outcome.

## Problem

Data incidents often leave teams with a symptom but not an explainable, safe path to recovery. RootCause AI turns an anomalous sales signal into a visible, evidence-backed investigation and a human-controlled remediation flow.

## Demo scenario

The demo investigates a 38% sales drop. It correlates the anomaly with an inventory ETL failure caused by duplicate records, estimates the impact, requests approval to reprocess the ETL, and shows resolution only after post-recovery verification.

## Links to complete before submission

- Repository: https://github.com/IvanOcampos/rootcause-ai
- Demo video: _add public link_
- Deployed demo: _add public link, if available_
- Team members and roles: _add names_

## How to verify

Follow [README.md](README.md), then run `scripts/verify-demo.ps1 -RequireFullFlow` once the full workflow is running. The presenter script is in [demo/demo-script.md](demo/demo-script.md).

## Build disclosure

This repository contains the hackathon implementation. The demo uses clearly identified synthetic incident data; no production credentials or sensitive data are required.
