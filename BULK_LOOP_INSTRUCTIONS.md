# Bulk multi-case loop mode

## What changed
- Upload one JSON or CSV dataset with multiple rows.
- The agent now detects bulk mode automatically when the uploaded file has more than one record.
- The backend loops through each case one by one.
- Each case is matched to one main route using the `action` value.
- The output is returned in a repeated structure under `caseResults`.
- The frontend shows the looped case display with PASS/FAIL for each case.

## Supported dataset actions
- `create_customer` -> `POST /customers`
- `check_eligibility` -> `POST /underwriting/check-eligibility`
- `create_loan` -> `POST /loans`
- `make_payment` -> `POST /payments`

## How to run
1. Start the API server.
2. Start the agent server.
3. Start the frontend.
4. Log in to the frontend.
5. Enter the Swagger URL.
6. Upload the bulk JSON file.
7. Use a prompt such as: `Run this dataset in bulk and show each case result in a loop`.
8. Click Send.

## What to look for
- Uploaded file summary shows more than 1 record.
- Summary cards show total cases, passed, and failed.
- Detailed loop display shows one card per case.
- Each case row shows PASS or FAIL on the right side.
- `caseResults` is included in the API response.
