# Valid Position Values for NARAP Member Import

When importing members via CSV, the `position` field must use one of these exact values (all in UPPERCASE):

## Executive Positions
- `PRESIDENT`
- `DEPUTY PRESIDENT`
- `VICE PRESIDENT (South West)`
- `VICE PRESIDENT (South East)`
- `VICE PRESIDENT (South South)`
- `VICE PRESIDENT (North West)`
- `VICE PRESIDENT (North Central)`
- `VICE PRESIDENT (North East)`

## Secretarial Positions
- `SECRETARY`
- `ASSISTANT SECRETARY`
- `STATE SECRETARY`
- `STATE ASSISTANT SECRETARY`

## Financial Positions
- `FINANCIAL SECRETARY`
- `ASSISTANT FINANCIAL SECRETARY`
- `TREASURER`
- `STATE FINANCIAL SECRETARY`
- `STATE TREASURER`

## Welfare & Public Relations
- `WELFARE`
- `STATE WELFARE COORDINATOR`
- `PUBLIC RELATION OFFICER`
- `PUBLIC RELATION OFFICE`

## Security & Task Force
- `TASK FORCE`
- `PROVOST MARSHAL 1`
- `PROVOST MARSHAL 2`

## Coordination
- `COORDINATOR`
- `ASSISTANT COORDINATOR`

## Leadership
- `CHAIRMAN`
- `VICE CHAIRMAN`

## General Membership
- `MEMBER` (default value)

## CSV Import Example

```csv
Name,Email,Code,Position,State,Zone,Password
John Doe,john@example.com,NARAP001,MEMBER,Lagos,South West,password123
Jane Smith,jane@example.com,NARAP002,SECRETARY,Abuja,North Central,password123
Mike Johnson,mike@example.com,NARAP003,TREASURER,Kano,North West,password123
```

## Important Notes

1. **Case Sensitive**: All position values must be in UPPERCASE
2. **Exact Match**: The position must exactly match one of the values above
3. **Default**: If no position is specified, it defaults to `MEMBER`
4. **Validation**: The backend will reject any import with invalid position values

## Common Errors

- ❌ `"Member"` (should be `"MEMBER"`)
- ❌ `"secretary"` (should be `"SECRETARY"`)
- ❌ `"Treasurer"` (should be `"TREASURER"`)
- ❌ `"PRESIDENT"` (correct format) 