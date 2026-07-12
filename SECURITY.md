# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within Loom, please send an email to [security@example.com]. All security vulnerabilities will be promptly addressed.

Please include the following information in your report:

- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Practices

### Data Privacy

- **Local Storage Only**: All data is stored locally on your device using IndexedDB (web) or SQLite (Android)
- **No Cloud Sync**: No data is sent to any external server
- **No Analytics**: No user tracking or analytics collection
- **No Accounts**: No user registration or authentication required

### Data Protection

- Export files contain only the data you explicitly choose to export
- Backup files are JSON format and can be inspected before restoring
- Clear All Data function permanently deletes all stored information

### Dependencies

- Regular dependency updates to address known vulnerabilities
- Minimal dependencies to reduce attack surface

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Best Practices for Users

1. **Keep backups**: Regularly export your data
2. **Use strong device passwords**: Protect access to your device
3. **Update the app**: Use the latest version for security patches
4. **Review permissions**: Only grant necessary permissions (Health Connect)

## Open Source

Loom is open source, which means the code is publicly auditable. Security researchers are welcome to review the codebase.
