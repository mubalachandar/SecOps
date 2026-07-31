# Detection Rules System

## Introduction
SecOps AI Copilot utilizes a custom-built, in-memory JSON pattern-matching engine to evaluate AWS CloudTrail logs in real-time. Every rule is strictly mapped to the **MITRE ATT&CK** framework—a globally accessible knowledge base of adversary tactics and techniques based on real-world observations. Mapping to MITRE allows SOC analysts to understand the adversary's intent and lifecycle stage (Tactic) and how they are trying to achieve it (Technique).

---

## Built-In Detection Rules

### 1. Root Account Usage
* **MITRE Tactic**: Privilege Escalation (TA0004)
* **MITRE Technique**: Valid Accounts (T1078)
* **Severity**: Critical
* **Description**: Detects any AWS API call made by the AWS account root user.
* **Why it matters**: The root account has unrestricted access to all resources. AWS strongly recommends locking away the root credentials and using IAM roles instead. Root usage often indicates a critical compromise or a dangerous misconfiguration.
* **Pattern**:
  ```json
  { "type": "json_path", "path": "userIdentity.type", "value": "Root" }
  ```
* **Example Event**: Console login where `userIdentity.type` is `Root`.
* **Recommended Response**: Immediately verify the user. Rotate root password and ensure MFA is enforced.

### 2. Console Login Without MFA
* **MITRE Tactic**: Credential Access (TA0006)
* **MITRE Technique**: Two-Factor Authentication Interception (T1111)
* **Severity**: High
* **Description**: Detects successful AWS Management Console logins where Multi-Factor Authentication (MFA) was not used.
* **Why it matters**: MFA is the primary defense against credential stuffing and phishing. Logins without MFA expose the environment to significant risk.
* **Pattern**:
  ```json
  {
    "type": "composite",
    "operator": "AND",
    "patterns": [
      { "type": "exact_match", "field": "eventName", "value": "ConsoleLogin" },
      { "type": "json_path", "path": "additionalEventData.MFAUsed", "value": "No" }
    ]
  }
  ```

### 3. CloudTrail Logging Disabled
* **MITRE Tactic**: Defense Evasion (TA0005)
* **MITRE Technique**: Impair Defenses: Disable Cloud Logs (T1562.008)
* **Severity**: Critical
* **Description**: Detects actions that stop, delete, or modify CloudTrail logging.
* **Why it matters**: Attackers often disable logging immediately upon gaining access to operate undetected.
* **Pattern**:
  ```json
  { "type": "in_list", "field": "eventName", "values": ["StopLogging", "DeleteTrail", "UpdateTrail"] }
  ```

### 4. EC2 Instance Enumeration
* **MITRE Tactic**: Discovery (TA0007)
* **MITRE Technique**: Account Discovery (T1087)
* **Severity**: Low
* **Description**: Detects requests attempting to list or describe EC2 instances.
* **Why it matters**: Often the first step an attacker takes after initial access to understand the environment layout.
* **Pattern**:
  ```json
  { "type": "exact_match", "field": "eventName", "value": "DescribeInstances" }
  ```

### 5. Unauthorized Security Group Modification
* **MITRE Tactic**: Defense Evasion (TA0005)
* **MITRE Technique**: Impair Defenses: Disable Network Traffic Routing (T1562.007)
* **Severity**: High
* **Description**: Detects ingress/egress rules being added or deleted from Security Groups.
* **Why it matters**: Attackers alter security groups to open RDP/SSH ports (3389/22) to the public internet for persistence.
* **Pattern**:
  ```json
  { "type": "in_list", "field": "eventName", "values": ["AuthorizeSecurityGroupIngress", "RevokeSecurityGroupIngress"] }
  ```

### 6. IAM User Creation
* **MITRE Tactic**: Persistence (TA0003)
* **MITRE Technique**: Create Account: Cloud Account (T1136.003)
* **Severity**: Medium
* **Description**: Detects the creation of new IAM users or access keys.
* **Why it matters**: Creating backdoor IAM users is a standard persistence mechanism.
* **Pattern**:
  ```json
  { "type": "in_list", "field": "eventName", "values": ["CreateUser", "CreateAccessKey"] }
  ```

### 7. S3 Bucket Public Access Block Removed
* **MITRE Tactic**: Credential Access / Exfiltration (TA0006, TA0010)
* **MITRE Technique**: Data from Cloud Storage (T1530)
* **Severity**: High
* **Description**: Detects the removal of public access block configurations on S3 buckets.
* **Why it matters**: Leads to massive data leaks and exposed PII.
* **Pattern**:
  ```json
  { "type": "exact_match", "field": "eventName", "value": "DeletePublicAccessBlock" }
  ```

### 8. Secrets Manager Secret Accessed
* **MITRE Tactic**: Credential Access (TA0006)
* **MITRE Technique**: Steal Application Access Token (T1528)
* **Severity**: Critical
* **Description**: Detects access to plaintext secrets via AWS Secrets Manager.
* **Why it matters**: Attackers use compromised roles to dump API keys and database passwords to pivot laterally.
* **Pattern**:
  ```json
  { "type": "exact_match", "field": "eventName", "value": "GetSecretValue" }
  ```

### 9. Large EC2 Instance Launched
* **MITRE Tactic**: Resource Hijacking (TA0040)
* **MITRE Technique**: Resource Hijacking (T1496)
* **Severity**: Medium
* **Description**: Detects the launch of highly expensive GPU instance types (e.g., `p3`, `g4dn`).
* **Why it matters**: A strong indicator of cryptocurrency mining operations.
* **Pattern**:
  ```json
  { "type": "regex", "field": "requestParameters", "value": "p3\\.|g4dn\\." }
  ```

### 10. Unrecognized Region Activity
* **MITRE Tactic**: Initial Access (TA0001)
* **MITRE Technique**: Exploit Public-Facing Application (T1190)
* **Severity**: High
* **Description**: Detects activity occurring outside the primary business region (e.g., `us-east-1`).
* **Why it matters**: Compromised access keys are often sold and utilized from disparate geographic regions to evade standard alerting.
* **Pattern**:
  ```json
  { "type": "regex", "field": "awsRegion", "value": "^(?!us-east-1).*$" }
  ```

---

## Event Patterns Reference

1. **`exact_match`**: Field value must equal string exactly.
   ```json
   { "type": "exact_match", "field": "eventName", "value": "DeleteTrail" }
   ```
2. **`contains`**: Substring check. Valid on strings or JSON objects.
   ```json
   { "type": "contains", "field": "userAgent", "value": "Kali" }
   ```
3. **`in_list`**: Matches if the field value exists in an array.
   ```json
   { "type": "in_list", "field": "eventName", "values": ["StartInstances", "StopInstances"] }
   ```
4. **`regex`**: Standard Javascript RegExp execution.
   ```json
   { "type": "regex", "field": "sourceIPAddress", "value": "^10\\." }
   ```
5. **`json_path`**: Traverse nested JSON.
   ```json
   { "type": "json_path", "path": "userIdentity.arn", "value": "arn:aws:iam::123:root" }
   ```
6. **`composite`**: AND / OR combinator.
   ```json
   {
     "type": "composite",
     "operator": "AND",
     "patterns": [ { ... }, { ... } ]
   }
   ```

---

## How to Create Custom Rules

1. Navigate to the **Detection Rules** page in the UI.
2. Click **Create New Rule**.
3. Provide metadata (Name, MITRE tags).
4. Construct the JSON pattern based on the reference above.

### Example 1: Detect GuardDuty Suspension
```json
{ "type": "exact_match", "field": "eventName", "value": "SuspendDetector" }
```

### Example 2: Detect Key Deletion
```json
{ "type": "exact_match", "field": "eventName", "value": "DeleteAccessKey" }
```

### Example 3: Detect Login from specific IP range
```json
{
  "type": "composite",
  "operator": "AND",
  "patterns": [
    { "type": "exact_match", "field": "eventName", "value": "ConsoleLogin" },
    { "type": "regex", "field": "sourceIPAddress", "value": "^192\\.168\\." }
  ]
}
```

---

## Testing Rules

You can safely test detection patterns before deploying them using the **Test Rule** UI panel, or via the API:
```bash
curl -X POST http://localhost:5000/api/v1/rules/test \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": { "type": "exact_match", "field": "eventName", "value": "StopLogging" },
    "event": { "eventName": "StopLogging" }
  }'
```
Returns a `matched: true` or `false` boolean without saving an alert to the database.
