# Security

This repository is a **local security lab baseline** (demo data, intentional misconfigurations, and PCI-style anti-patterns for training). Do not deploy it to production or point it at real cardholder data.

## Reporting

If you believe you have found a security issue in this demo project itself, open a private advisory or contact the repository owner. This is not a production service and has no bug bounty.

## Secrets

Never commit `.env` files or database files. Use `.env.example` as a template and generate strong values locally for `JWT_SECRET` and `SESSION_SECRET`.
